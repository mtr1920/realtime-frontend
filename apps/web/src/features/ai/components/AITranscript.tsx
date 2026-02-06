/**
 * AITranscript Component
 *
 * Displays the AI conversation transcript:
 * - User and AI messages
 * - Streaming text updates
 * - Auto-scroll to latest
 * - Speaker indicators
 */

import { forwardRef, useEffect, useRef, useState, memo } from 'react';
import { User, Bot } from 'lucide-react';
import { ScrollArea } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

// =============================================================================
// Types
// =============================================================================

export interface TranscriptEntry {
  /** Unique entry ID */
  id: string;
  /** Speaker type */
  speaker: 'user' | 'ai';
  /** Display name */
  speakerName?: string;
  /** Message text */
  text: string;
  /** Timestamp */
  timestamp: number;
  /** Whether this is still being streamed */
  isStreaming?: boolean;
}

interface AITranscriptProps {
  /** Transcript entries */
  entries: TranscriptEntry[];
  /** Auto-scroll to bottom */
  autoScroll?: boolean;
  /** Maximum height (CSS value) */
  maxHeight?: string;
  /** Additional class name */
  className?: string;
  /** Empty state message */
  emptyMessage?: string;
}

interface TranscriptEntryProps {
  entry: TranscriptEntry;
}

// =============================================================================
// Helpers
// =============================================================================

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// =============================================================================
// TranscriptEntry Component
// =============================================================================

const TranscriptEntryItem = memo(function TranscriptEntryItem({
  entry,
}: TranscriptEntryProps) {
  const isUser = entry.speaker === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 p-3 rounded-lg',
        isUser ? 'bg-muted/50' : 'bg-primary/5'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-muted' : 'bg-primary/10'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Bot className="h-4 w-4 text-primary" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Header */}
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">
            {entry.speakerName ?? (isUser ? 'You' : 'AI Assistant')}
          </span>
          <span className="text-muted-foreground text-xs">
            {formatTime(entry.timestamp)}
          </span>
        </div>

        {/* Message */}
        <div
          className={cn(
            'text-sm whitespace-pre-wrap break-words',
            entry.isStreaming && 'after:content-["▊"] after:motion-safe:animate-pulse after:ml-0.5'
          )}
        >
          {entry.text || (entry.isStreaming ? '' : '...')}
        </div>
      </div>
    </div>
  );
});

// =============================================================================
// AITranscript Component
// =============================================================================

export const AITranscript = forwardRef<HTMLDivElement, AITranscriptProps>(
  (
    {
      entries,
      autoScroll = true,
      maxHeight = '400px',
      className,
      emptyMessage = 'No conversation yet. Start speaking to begin.',
    },
    ref
  ) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const endRef = useRef<HTMLDivElement>(null);
    const prevEntriesLengthRef = useRef(0);
    const [announcement, setAnnouncement] = useState('');

    // Auto-scroll to bottom when new entries arrive
    useEffect(() => {
      if (autoScroll && endRef.current) {
        endRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, [entries, autoScroll]);

    // Only announce new, completed messages (not initial state or streaming)
    useEffect(() => {
      if (entries.length > prevEntriesLengthRef.current && entries.length > 0) {
        const latestEntry = entries[entries.length - 1];
        // Only announce when message is not actively streaming
        if (latestEntry && !latestEntry.isStreaming) {
          setAnnouncement(
            `${latestEntry.speaker === 'user' ? 'You' : 'AI'}: ${latestEntry.text}`
          );
        }
      }
      prevEntriesLengthRef.current = entries.length;
    }, [entries]);

    // Empty state
    if (entries.length === 0) {
      return (
        <div
          ref={ref}
          className={cn(
            'flex items-center justify-center text-muted-foreground text-sm p-8',
            className
          )}
          style={{ maxHeight }}
        >
          {emptyMessage}
        </div>
      );
    }

    return (
      <>
        {/* Live region for screen reader announcements */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {announcement}
        </div>
        <ScrollArea
          ref={ref}
          className={cn('pr-4', className)}
          style={{ maxHeight }}
          aria-label="AI conversation transcript"
        >
          <div ref={scrollRef} className="space-y-3 py-2">
            {entries.map((entry) => (
              <TranscriptEntryItem key={entry.id} entry={entry} />
            ))}
            <div ref={endRef} />
          </div>
        </ScrollArea>
      </>
    );
  }
);

AITranscript.displayName = 'AITranscript';

// =============================================================================
// Compact Transcript (for sidebar/overlay)
// =============================================================================

interface CompactTranscriptProps {
  /** Last few entries to show */
  entries: TranscriptEntry[];
  /** Number of entries to display */
  limit?: number;
  /** Additional class name */
  className?: string;
}

export function CompactTranscript({
  entries,
  limit = 3,
  className,
}: CompactTranscriptProps) {
  const recentEntries = entries.slice(-limit);

  if (recentEntries.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      {recentEntries.map((entry) => {
        const isUser = entry.speaker === 'user';

        return (
          <div
            key={entry.id}
            className={cn(
              'text-xs p-2 rounded',
              isUser ? 'bg-muted/50' : 'bg-primary/5'
            )}
          >
            <span className="font-medium">
              {isUser ? 'You' : 'AI'}:
            </span>{' '}
            <span className="text-muted-foreground line-clamp-2">
              {entry.text}
            </span>
          </div>
        );
      })}
    </div>
  );
}
