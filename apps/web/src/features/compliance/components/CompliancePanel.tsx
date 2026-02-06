/**
 * CompliancePanel Component
 *
 * Observer/moderator panel for viewing compliance violation history.
 * Permission-gated to users with canViewCompliance permission.
 */

import { useCallback } from 'react';
import { Shield, RefreshCw, Download, Loader2 } from 'lucide-react';
import { Button, Badge, Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { useSubscription } from '@/features/realtime';
import { useSessionStore } from '@/shared/stores/session.store';
import {
  useComplianceHistoryStore,
  selectViolationsCount,
  selectHasActiveFilter,
} from '../stores/compliance-history.store';
import { ViolationFilters } from './ViolationFilters';
import { ViolationList } from './ViolationList';
import { ComplianceTimeline } from './ComplianceTimeline';

export interface CompliancePanelProps {
  /** Maximum height for the panel */
  maxHeight?: string;
  /** Additional class names */
  className?: string;
}

/**
 * Compliance panel for observers and moderators
 *
 * @example
 * ```tsx
 * <PermissionGate permission="canViewCompliance">
 *   <CompliancePanel maxHeight="400px" />
 * </PermissionGate>
 * ```
 */
export function CompliancePanel({ maxHeight = '400px', className }: CompliancePanelProps) {
  const session = useSessionStore((state) => state.session);
  const addViolation = useComplianceHistoryStore((state) => state.addViolation);
  const getFilteredViolations = useComplianceHistoryStore((state) => state.getFilteredViolations);
  const isLoading = useComplianceHistoryStore((state) => state.isLoading);
  const error = useComplianceHistoryStore((state) => state.error);
  const totalCount = useComplianceHistoryStore(selectViolationsCount);
  const hasActiveFilter = useComplianceHistoryStore(selectHasActiveFilter);

  const filteredViolations = getFilteredViolations();

  // Subscribe to real-time violations
  useSubscription('compliance.violation', (payload) => {
    addViolation(payload.violation);
  });

  // Export violations to JSON
  const handleExport = useCallback(() => {
    const data = JSON.stringify(filteredViolations, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const filename = `compliance-report-${new Date().toISOString().slice(0, 10)}.json`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredViolations]);

  // Error state
  if (error) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-8', className)}>
        <p className="text-sm text-destructive mb-2">{error}</p>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-medium">Compliance Monitor</span>
          <Badge
            variant="secondary"
            className="text-xs"
            aria-label={hasActiveFilter ? `Showing ${filteredViolations.length} of ${totalCount} violations` : `${totalCount} violations`}
          >
            <span aria-hidden="true">
              {hasActiveFilter ? `${filteredViolations.length}/${totalCount}` : totalCount}
            </span>
            <span className="sr-only">
              {hasActiveFilter ? `Showing ${filteredViolations.length} of ${totalCount} violations` : `${totalCount} violations`}
            </span>
          </Badge>
          {isLoading && <Loader2 className="h-3 w-3 motion-safe:animate-spin text-muted-foreground" aria-label="Loading" />}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExport}
          disabled={filteredViolations.length === 0}
        >
          <Download className="h-4 w-4 mr-1" />
          Export
        </Button>
      </div>

      {/* Timeline */}
      <div className="py-3 border-b">
        <ComplianceTimeline
          violations={filteredViolations}
          sessionStartTime={session?.actualStartTime}
        />
      </div>

      {/* Tabs for List and Filters */}
      <Tabs defaultValue="violations" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="filters">
            Filters
            {hasActiveFilter && (
              <span className="ml-1 w-2 h-2 rounded-full bg-primary" />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="violations" className="flex-1 overflow-hidden mt-3">
          <ViolationList
            violations={filteredViolations}
            maxHeight={maxHeight}
            showTimestamps
          />
        </TabsContent>

        <TabsContent value="filters" className="mt-3">
          <ViolationFilters />
        </TabsContent>
      </Tabs>
    </div>
  );
}
