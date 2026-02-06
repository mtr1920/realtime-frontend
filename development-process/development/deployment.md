# Deployment & Build

## Build Commands

```bash
# Development
pnpm install          # Install dependencies
pnpm dev:web          # Start dev server (localhost:3000)

# Production build
pnpm build:web        # Production build
pnpm preview:web      # Preview production build

# Quality checks
pnpm typecheck:web    # TypeScript checking
pnpm lint:web         # ESLint
pnpm format           # Prettier formatting
pnpm test:web         # Unit tests
pnpm test:web:e2e     # E2E tests
```

## Environment Variables

```bash
# .env.local (development)
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3001

# Feature flags
VITE_ENABLE_DEV_TOOLS=true
VITE_ENABLE_MOCK_DATA=false

# Analytics (optional)
VITE_ANALYTICS_ID=
VITE_SENTRY_DSN=

# Build info
VITE_APP_VERSION=$npm_package_version
```

### Environment Files

| File | Purpose |
|------|---------|
| `.env` | Default values (committed) |
| `.env.local` | Local overrides (not committed) |
| `.env.production` | Production values |
| `.env.staging` | Staging values |

### Accessing Variables

```typescript
// In code
const apiUrl = import.meta.env.VITE_API_URL;
const wsUrl = import.meta.env.VITE_WS_URL;
const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

// Type definitions
// vite-env.d.ts
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WS_URL: string;
  readonly VITE_ENABLE_DEV_TOOLS: string;
}
```

## Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          // React Compiler (experimental)
          ['babel-plugin-react-compiler', {}],
        ],
      },
    }),
    tsconfigPaths(),
  ],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['@tanstack/react-router'],
          query: ['@tanstack/react-query'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-popover'],
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
```

## Build Output

```
dist/
├── assets/
│   ├── index-[hash].js      # Main bundle
│   ├── vendor-[hash].js     # React, React DOM
│   ├── router-[hash].js     # TanStack Router
│   ├── query-[hash].js      # TanStack Query
│   ├── ui-[hash].js         # Radix UI
│   └── index-[hash].css     # Styles
├── index.html
└── audio-processor.worklet.js
```

## Bundle Size Targets

| Chunk | Target | Current |
|-------|--------|---------|
| Main | < 50KB gzip | 36.75KB |
| Vendor | < 100KB gzip | ~50KB |
| Total | < 200KB gzip | ~150KB |

## Production Optimizations

### Code Splitting

```typescript
// Route-based splitting
const SessionRoom = lazy(() => import('./features/session/pages/SessionRoom'));
const AdminDashboard = lazy(() => import('./features/admin/pages/AdminDashboard'));

// Component-level splitting
const VideoGrid = lazy(() => import('./components/VideoGrid'));
```

### Tree Shaking

```typescript
// ✅ Named imports for tree shaking
import { Button, Card } from '@realtime/ui';

// ❌ Avoid barrel re-exports of large modules
import * as UI from '@realtime/ui';
```

### Asset Optimization

```typescript
// Images - use WebP or AVIF
<img src="/logo.webp" alt="Logo" />

// Icons - use Lucide React (tree-shakeable)
import { Mic, Video } from 'lucide-react';
```

## Docker Build

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build:web

FROM nginx:alpine
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install
      - run: pnpm typecheck:web
      - run: pnpm lint:web
      - run: pnpm test:web
      - run: pnpm build:web
```

## Performance Monitoring

### Core Web Vitals Targets

| Metric | Target | Description |
|--------|--------|-------------|
| LCP | < 2.5s | Largest Contentful Paint |
| INP | < 200ms | Interaction to Next Paint |
| CLS | < 0.1 | Cumulative Layout Shift |

### Monitoring (Optional)

```typescript
// Error tracking (Sentry)
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
});

// Analytics
if (import.meta.env.VITE_ANALYTICS_ID) {
  initAnalytics(import.meta.env.VITE_ANALYTICS_ID);
}
```

## Related Documentation

- [Coding Standards](./coding-standards.md)
- [Testing Strategy](./testing-strategy.md)
