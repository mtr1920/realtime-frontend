/**
 * OutcomeArtifactsPanel Component
 * Displays list of downloadable artifacts.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';
import { Button } from '@/shared/ui';
import { Badge } from '@/shared/ui';
import { useDownloadArtifact } from '../hooks/useDownloadArtifact';
import { showSuccess, handleError } from '@/shared/errors';
import { artifactTypeLabels, type OutcomeArtifact } from '../types/outcomes.types';

interface OutcomeArtifactsPanelProps {
  artifacts: OutcomeArtifact[];
  isLoading?: boolean;
}

export function OutcomeArtifactsPanel({
  artifacts,
  isLoading = false,
}: OutcomeArtifactsPanelProps) {
  const { downloadArtifact, isLoading: isDownloading } = useDownloadArtifact({
    onSuccess: () => {
      showSuccess('Artifact downloaded successfully');
    },
    onError: (error) => {
      handleError(error, { message: 'Failed to download artifact' });
    },
  });

  const formatSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Artifacts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={`skeleton-${i}`}
                className="h-16 motion-safe:animate-pulse rounded-lg bg-muted"
                aria-label="Loading artifact"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (artifacts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Artifacts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No artifacts available for this outcome.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Artifacts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {artifacts.map((artifact) => (
            <div
              key={artifact.id}
              className="flex items-center justify-between rounded-lg border border-border p-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary">
                    {artifactTypeLabels[artifact.type]}
                  </Badge>
                  {artifact.redacted && (
                    <Badge variant="destructive">Redacted</Badge>
                  )}
                </div>
                <p className="text-sm font-medium truncate">{artifact.name}</p>
                {artifact.description && (
                  <p className="text-xs text-muted-foreground truncate">
                    {artifact.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {artifact.mimeType && `${artifact.mimeType} • `}
                  {formatSize(artifact.sizeBytes)}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadArtifact(artifact)}
                disabled={isDownloading}
                aria-label={`Download ${artifact.name}`}
              >
                Download
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
