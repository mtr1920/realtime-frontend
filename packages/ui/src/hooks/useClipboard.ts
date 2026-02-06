import { useState, useCallback } from 'react';

interface UseClipboardOptions {
  /**
   * Duration in milliseconds to keep the copied state true.
   * @default 2000
   */
  timeout?: number;
}

interface UseClipboardReturn {
  /**
   * Copy text to clipboard
   */
  copy: (text: string) => Promise<boolean>;
  /**
   * Whether the text was recently copied (within timeout period)
   */
  copied: boolean;
  /**
   * Any error that occurred during copy
   */
  error: Error | null;
  /**
   * Reset the copied state
   */
  reset: () => void;
}

/**
 * Hook for copying text to clipboard with feedback state.
 *
 * @example
 * ```tsx
 * function CopyButton({ text }: { text: string }) {
 *   const { copy, copied } = useClipboard();
 *
 *   return (
 *     <button onClick={() => copy(text)}>
 *       {copied ? 'Copied!' : 'Copy'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useClipboard(options: UseClipboardOptions = {}): UseClipboardReturn {
  const { timeout = 2000 } = options;

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      if (!navigator?.clipboard) {
        const fallbackError = new Error('Clipboard API not available');
        setError(fallbackError);
        return false;
      }

      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setError(null);

        // Reset copied state after timeout
        setTimeout(() => {
          setCopied(false);
        }, timeout);

        return true;
      } catch (err) {
        const copyError = err instanceof Error ? err : new Error('Failed to copy');
        setError(copyError);
        setCopied(false);
        return false;
      }
    },
    [timeout]
  );

  const reset = useCallback(() => {
    setCopied(false);
    setError(null);
  }, []);

  return { copy, copied, error, reset };
}
