/**
 * Redirect URL Utilities
 * Safe handling of return URLs to prevent redirect loops and security issues.
 */

/**
 * Paths that should never be used as return URLs (would cause loops).
 */
const BLOCKED_RETURN_PATHS = ['/login', '/logout', '/sso', '/auth'];

/**
 * Check if a path is safe to use as a return URL.
 * Prevents redirect loops and ensures internal-only redirects.
 */
export function isValidReturnUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false;

  // Must start with / (internal path only)
  if (!url.startsWith('/')) return false;

  // Block external URLs disguised as paths (e.g., //evil.com)
  if (url.startsWith('//')) return false;

  // Block login-related paths to prevent loops
  const pathname = url.split('?')[0]?.toLowerCase() ?? '';
  if (BLOCKED_RETURN_PATHS.some((blocked) => pathname.startsWith(blocked))) {
    return false;
  }

  return true;
}

/**
 * Sanitize a return URL, returning a safe default if invalid.
 * Handles URL decoding and validation.
 */
export function sanitizeReturnUrl(
  url: string | undefined | null,
  fallback = '/'
): string {
  if (!url) return fallback;

  try {
    // Decode if URL-encoded (handle multiple levels of encoding)
    let decoded = url;
    let prevDecoded = '';
    while (decoded !== prevDecoded && decoded.includes('%')) {
      prevDecoded = decoded;
      decoded = decodeURIComponent(decoded);
    }

    // Extract just the pathname (ignore any embedded query strings)
    const pathname = decoded.split('?')[0] ?? decoded;

    return isValidReturnUrl(pathname) ? pathname : fallback;
  } catch {
    // decodeURIComponent can throw on malformed URLs
    return fallback;
  }
}

/**
 * Get the current pathname for use as a return URL.
 * Only returns pathname if it's valid for redirect.
 */
export function getCurrentReturnUrl(): string | undefined {
  const pathname = window.location.pathname;
  return isValidReturnUrl(pathname) ? pathname : undefined;
}
