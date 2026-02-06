/**
 * @realtime/ui - Enterprise-grade UI component library
 *
 * This package provides pure UI components with no business logic.
 * Components can be used in any React app without knowing about
 * users, sessions, tenants, or calling any specific API.
 */

// Re-export all components (includes primitives)
export * from './components';

// Re-export primitives separately for direct imports
export * from './primitives';

// Re-export themes
export * from './themes';

// Re-export hooks
export * from './hooks';

// Re-export utilities
export { cn } from './utils';
