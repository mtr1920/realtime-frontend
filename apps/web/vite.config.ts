import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => ({
  appType: 'spa', // Enable history API fallback for client-side routing
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', {}]],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@protocol': path.resolve(__dirname, '../../packages/protocol/src'),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json'],
  },
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    headers: {
      // Content Security Policy for XSS protection
      // Note: In production, configure CSP via reverse proxy/CDN for stricter control
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-* needed for Vite HMR in dev
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data: https://fonts.gstatic.com",
        "connect-src 'self' ws://localhost:* wss://localhost:* http://localhost:* https://localhost:* ws://127.0.0.1:* wss://127.0.0.1:* http://127.0.0.1:* https://127.0.0.1:* http://74.225.173.20:*",
        "media-src 'self' blob:",
        "object-src 'none'",
        "frame-ancestors 'self'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; '),
      // Prevent MIME type sniffing
      'X-Content-Type-Options': 'nosniff',
      // Prevent clickjacking
      'X-Frame-Options': 'SAMEORIGIN',
      // Enable browser XSS filter
      'X-XSS-Protection': '1; mode=block',
      // Referrer policy for privacy
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      // Permissions policy to restrict browser features
      'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=(), payment=()',
    },
  },
  build: {
    target: 'ES2022',
    sourcemap: false, // Disabled in production for smaller bundles
    chunkSizeWarningLimit: 600, // Warn if chunk > 600 KB (vendor chunk ~558KB is acceptable)
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Only process node_modules for vendor splitting
          if (id.includes('node_modules')) {
            // TanStack libraries - separate chunk for data/routing layer
            if (id.includes('@tanstack/react-router')) {
              return 'vendor-router';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query';
            }
            // Form validation - separate chunk (large, not always needed)
            if (id.includes('zod') || id.includes('@hookform') || id.includes('react-hook-form')) {
              return 'vendor-forms';
            }
            // All other vendors in one chunk to avoid circular dependencies
            return 'vendor';
          }
          // Let Vite handle app code splitting via dynamic imports
          return undefined;
        },
      },
    },
    // CSS optimization
    cssCodeSplit: true,
  },
  // esbuild options for production optimization
  esbuild:
    mode === 'production'
      ? {
          drop: ['console', 'debugger'],
        }
      : {},
  // Dependency optimization
  optimizeDeps: {
    // Pre-bundle these dependencies for faster dev server startup
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      '@tanstack/react-router',
      'zustand',
      'react-hook-form',
      '@hookform/resolvers/zod',
      'zod',
      'lucide-react',
    ],
  },
}));
