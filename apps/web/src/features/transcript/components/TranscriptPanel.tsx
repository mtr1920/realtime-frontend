/**
 * TranscriptPanel Component
 *
 * Real-time transcript panel with virtual scrolling and export.
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { Loader2, MessageSquareText, RefreshCw } from 'lucide-react';
import { Button, ScrollArea } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { useTranscript } from '../hooks/useTranscript';
import { TranscriptEntry } from './TranscriptEntry';
import { TranscriptExport } from './TranscriptExport';

export interface TranscriptPanelProps {
  /** Whether transcript is enabled */
  enabled?: boolean;
  /** Maximum height of the panel */
  maxHeight?: string;
  /** Additional class names */
  className?: string;
}

/**
 * Transcript panel with real-time updates and export
 *
 * @example
 * ```tsx
 * <TranscriptPanel enabled={canViewTranscript} maxHeight="400px" />
 * ```
 */
export function TranscriptPanel({
  enabled = true,
  maxHeight = '400px',
  className,
}: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const { turns, turnsCount, isSyncing, error, requestSync } = useTranscript({
    enabled,
  });

  // Auto-scroll to bottom when new turns arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns, autoScroll]);

  // Detect manual scroll to disable auto-scroll
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const isAtBottom =
      Math.abs(target.scrollHeight - target.scrollTop - target.clientHeight) < 50;
    setAutoScroll(isAtBottom);
  }, []);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      setAutoScroll(true);
    }
  }, []);

  // Request initial sync on mount
  useEffect(() => {
    if (enabled && turnsCount === 0) {
      requestSync();
    }
  }, [enabled, turnsCount, requestSync]);

  // Empty state
  if (!enabled) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full', className)}>
        <MessageSquareText className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">Transcript is not available</p>
      </div>
    );
  }

  // Loading state
  if (isSyncing && turnsCount === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full', className)}>
        <Loader2 className="h-8 w-8 motion-safe:animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Loading transcript...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full gap-4', className)}>
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={() => requestSync()}>
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
          <span className="text-sm font-medium">{turnsCount} entries</span>
          {isSyncing && <Loader2 className="h-3 w-3 motion-safe:animate-spin text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-2">
          {!autoScroll && (
            <Button variant="ghost" size="sm" onClick={scrollToBottom}>
              Scroll to bottom
            </Button>
          )}
          <TranscriptExport disabled={turnsCount === 0} />
        </div>
      </div>

      {/* Content */}
      <ScrollArea
        ref={scrollRef}
        className="flex-1"
        style={{ maxHeight }}
        onScroll={handleScroll}
      >
        {turnsCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <MessageSquareText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Transcript will appear here as people speak
            </p>
          </div>
        ) : (
          <div className="space-y-1 py-2">
            {turns.map((turn) => (
              <TranscriptEntry key={turn.turnId} turn={turn} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
