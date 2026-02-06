/**
 * PanelError Component
 *
 * Error fallback for tab panel content when parsing or rendering fails.
 */

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button, Card, CardContent } from '@/shared/ui';

interface PanelErrorProps {
  /** Name of the panel that errored */
  panel: string;
  /** Callback to retry/reset the panel */
  onRetry?: () => void;
}

export function PanelError({ panel, onRetry }: PanelErrorProps) {
  return (
    <Card className="border-destructive/50">
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <div className="p-3 rounded-full bg-destructive/10 mb-3">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h4 className="font-medium mb-1">Failed to load {panel}</h4>
        <p className="text-sm text-muted-foreground mb-4 max-w-xs">
          There was an error loading this panel. Try refreshing or use the
          Advanced tab to edit the raw configuration.
        </p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
