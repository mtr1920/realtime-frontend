/**
 * useDownloadArtifact Hook
 * Downloads an artifact.
 */

import { useState, useCallback } from 'react';
import { outcomesService } from '../api/outcomes.service';
import type { OutcomeArtifact } from '../types/outcomes.types';

interface UseDownloadArtifactOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useDownloadArtifact(options?: UseDownloadArtifactOptions) {
  const [isLoading, setIsLoading] = useState(false);

  const downloadArtifact = useCallback(
    async (artifact: OutcomeArtifact) => {
      setIsLoading(true);
      try {
        const blob = await outcomesService.downloadArtifact(
          artifact.outcomeId,
          artifact.id
        );

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = artifact.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        options?.onSuccess?.();
      } catch (error) {
        options?.onError?.(error as Error);
      } finally {
        setIsLoading(false);
      }
    },
    [options]
  );

  return {
    downloadArtifact,
    isLoading,
  };
}
