/**
 * OutcomeIntegrity Component
 * Displays compliance/integrity information.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';
import { Badge } from '@/shared/ui';
import { integrityStatusLabels, type OutcomeIntegrity as Integrity } from '../types/outcomes.types';

interface OutcomeIntegrityProps {
  integrity: Integrity;
}

export function OutcomeIntegrity({ integrity }: OutcomeIntegrityProps) {
  const getStatusVariant = (): 'success' | 'default' | 'destructive' => {
    switch (integrity.status) {
      case 'compliant':
        return 'success';
      case 'warning':
        return 'default';
      case 'violation':
        return 'destructive';
    }
  };

  const totalViolations = Object.values(integrity.violationCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Integrity</CardTitle>
          <Badge variant={getStatusVariant()}>
            {integrityStatusLabels[integrity.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Message */}
        <div className={`p-4 rounded-lg ${
          integrity.status === 'compliant'
            ? 'bg-green-50 dark:bg-green-950/30'
            : integrity.status === 'warning'
              ? 'bg-yellow-50 dark:bg-yellow-950/30'
              : 'bg-red-50 dark:bg-red-950/30'
        }`}>
          {integrity.status === 'compliant' ? (
            <p className="text-sm text-green-700 dark:text-green-300">
              No integrity issues detected during this session.
            </p>
          ) : (
            <p className={`text-sm ${
              integrity.status === 'warning'
                ? 'text-yellow-700 dark:text-yellow-300'
                : 'text-red-700 dark:text-red-300'
            }`}>
              {totalViolations} issue{totalViolations !== 1 ? 's' : ''} detected
              during this session.
            </p>
          )}
        </div>

        {/* Violation Counts */}
        {Object.keys(integrity.violationCounts).length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Issue Breakdown</p>
            <div className="space-y-2">
              {Object.entries(integrity.violationCounts).map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <span className="text-sm">{type}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Details */}
        {integrity.details && integrity.details.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Details</p>
            <ul className="space-y-1">
              {integrity.details.map((detail, index) => (
                <li key={`item-${index}`} className="flex gap-2 text-sm text-muted-foreground">
                  <span>•</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
