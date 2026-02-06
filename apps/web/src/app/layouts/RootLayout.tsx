import { Outlet } from '@tanstack/react-router';

/**
 * Root layout component with skip link for accessibility.
 */
export function RootLayout() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <main id="main-content" className="min-h-screen">
        <Outlet />
      </main>
    </>
  );
}
