/**
 * Session Recordings Tab
 * Displays list of recordings with playback and download options.
 * Fetches its own data via TanStack Query.
 */

import {
  Video,
  Play,
  Download,
  Trash2,
  MoreHorizontal,
  Loader2,
  FileVideo,
  Mic,
  Monitor,
  Film,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui';
import { EmptyState } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { useSessionRecordings } from '../../hooks/useSessionRecordings';

export type RecordingStatus =
  | 'PENDING'
  | 'RECORDING'
  | 'PROCESSING'
  | 'READY'
  | 'FAILED'
  | 'DELETED';

export type RecordingKind = 'AUDIO' | 'VIDEO' | 'SCREEN' | 'MIXED';

export interface Recording {
  id: string;
  kind: RecordingKind;
  status: RecordingStatus;
  startedAt: string | null;
  endedAt: string | null;
  durationMs: number | null;
  sizeBytes: number | null;
  downloadUrl?: string;
}

interface SessionRecordingsTabProps {
  /** Session ID to fetch recordings for */
  sessionId: string;
}

const KIND_CONFIG: Record<
  RecordingKind,
  { icon: React.ComponentType<{ className?: string }>; label: string }
> = {
  AUDIO: { icon: Mic, label: 'Audio' },
  VIDEO: { icon: Video, label: 'Video' },
  SCREEN: { icon: Monitor, label: 'Screen' },
  MIXED: { icon: Film, label: 'Mixed' },
};

const STATUS_CONFIG: Record<
  RecordingStatus,
  { label: string; color: string }
> = {
  PENDING: {
    label: 'Pending',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  RECORDING: {
    label: 'Recording',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  },
  PROCESSING: {
    label: 'Processing',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  },
  READY: {
    label: 'Ready',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  },
  FAILED: {
    label: 'Failed',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  },
  DELETED: {
    label: 'Deleted',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
};

function RecordingStatusBadge({ status }: { status: RecordingStatus }) {
  const config = STATUS_CONFIG[status];
  const isAnimated = status === 'RECORDING' || status === 'PROCESSING';

  return (
    <Badge
      variant="outline"
      className={cn('gap-1.5', config.color)}
    >
      {isAnimated && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              'absolute inline-flex h-full w-full rounded-full opacity-75',
              status === 'RECORDING' ? 'bg-red-400 animate-ping' : 'bg-amber-400 animate-pulse'
            )}
          />
          <span
            className={cn(
              'relative inline-flex rounded-full h-2 w-2',
              status === 'RECORDING' ? 'bg-red-500' : 'bg-amber-500'
            )}
          />
        </span>
      )}
      {config.label}
    </Badge>
  );
}

function formatDuration(durationMs: number | null): string {
  if (durationMs === null) return '-';

  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds % 60;
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes: number | null): string {
  if (bytes === null) return '-';

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(size < 10 ? 1 : 0)} ${units[unitIndex]}`;
}

export function SessionRecordingsTab({ sessionId }: SessionRecordingsTabProps) {
  // Fetch recordings for this session
  const { recordings, isLoading } = useSessionRecordings(sessionId);

  const handlePlay = (recording: Recording) => {
    if (recording.downloadUrl) {
      window.open(recording.downloadUrl, '_blank');
    } else {
      toast.info(`Playback not available for this ${recording.kind} recording.`);
    }
  };

  const handleDownload = (recording: Recording) => {
    if (recording.downloadUrl) {
      window.open(recording.downloadUrl, '_blank');
    } else {
      toast.info('Download not available for this recording.');
    }
  };

  const handleDelete = () => {
    toast.info('Recording deletion requires administrator access.');
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (recordings.length === 0) {
    return (
      <EmptyState
        icon={<FileVideo className="h-6 w-6 text-muted-foreground" />}
        title="No recordings"
        description="Recordings will appear here when recording is enabled for this session."
      />
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Started</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recordings.map((recording) => {
            const kindConfig = KIND_CONFIG[recording.kind];
            const KindIcon = kindConfig.icon;
            const isReady = recording.status === 'READY';
            const canPlay = isReady;
            const canDownload = isReady && recording.downloadUrl;

            return (
              <TableRow key={recording.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <KindIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{kindConfig.label}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <RecordingStatusBadge status={recording.status} />
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-sm">
                  {formatDuration(recording.durationMs)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatFileSize(recording.sizeBytes)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatTime(recording.startedAt)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {canPlay && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handlePlay(recording)}
                      >
                        <Play className="h-4 w-4" />
                        <span className="sr-only">Play</span>
                      </Button>
                    )}
                    {canDownload && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDownload(recording)}
                      >
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Download</span>
                      </Button>
                    )}
                    {isReady && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">More actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canPlay && (
                            <DropdownMenuItem onClick={() => handlePlay(recording)}>
                              <Play className="mr-2 h-4 w-4" />
                              Play
                            </DropdownMenuItem>
                          )}
                          {canDownload && (
                            <DropdownMenuItem onClick={() => handleDownload(recording)}>
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={handleDelete}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
