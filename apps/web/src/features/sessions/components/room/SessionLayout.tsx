/**
 * SessionLayout
 *
 * Main layout for the session room with config-driven module rendering.
 */

import { type ReactNode } from 'react';
import { Users, MessageSquare, FileText, Shield, Brain } from 'lucide-react';
import { Card, CardHeader, CardContent, Tabs, TabsContent, TabsList, TabsTrigger, Badge } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { useSessionConfig } from '../../hooks/useSessionConfig';
import { useSessionPermissions } from '../../hooks/useSessionPermissions';
import { useSessionStore } from '@/shared/stores/session.store';
import { useWebSocket } from '@/features/realtime';
import { RecordingIndicator } from '@/features/recording';
import { TranscriptPanel } from '@/features/transcript';
import { CompliancePanel } from '@/features/compliance';
import { AIPanel } from '@/features/ai';
import { ParticipantList } from './ParticipantList';
import { SessionTimer } from './SessionTimer';
import { SessionControls } from './SessionControls';
import { FacilitatorControls } from './FacilitatorControls';

export interface SessionLayoutProps {
  /** Main content area (video grid, etc.) */
  children: ReactNode;

  /** Called when leave session is requested */
  onLeave?: () => void;

  /** Called when end session is requested */
  onEndSession?: () => void;

  /** Whether an action is in progress */
  isLoading?: boolean;

  /** Additional CSS class */
  className?: string;
}

export function SessionLayout({
  children,
  onLeave,
  onEndSession,
  isLoading = false,
  className,
}: SessionLayoutProps) {
  const session = useSessionStore((state) => state.session);
  const { isConnected, isReconnecting } = useWebSocket();
  const {
    isModuleEnabled,
    isRecordingEnabled,
    isAIEnabled,
    isComplianceEnabled,
    isObserver,
  } = useSessionConfig();
  const { canViewComplianceData } = useSessionPermissions();

  // Connection state comes directly from WebSocketContext (single source of truth)

  return (
    <div
      className={cn(
        'flex h-full flex-col lg:flex-row gap-4 p-4',
        isObserver && 'observer-mode',
        className
      )}
    >
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold">
                {session?.title || 'Session'}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <SessionTimer startTime={session?.actualStartTime} />

                {/* Connection Status */}
                {!isConnected && (
                  <Badge
                    variant={isReconnecting ? 'secondary' : 'destructive'}
                    className="motion-safe:animate-pulse"
                  >
                    {isReconnecting ? 'Reconnecting...' : 'Disconnected'}
                  </Badge>
                )}

                {/* Recording Indicator */}
                {isRecordingEnabled && <RecordingIndicator />}
              </div>
            </div>
          </div>

          {/* Facilitator Controls */}
          <FacilitatorControls
            onEndSession={onEndSession}
            isLoading={isLoading}
          />
        </header>

        {/* Observer Banner */}
        {isObserver && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 dark:border-blue-800 dark:bg-blue-950">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              You are observing this session. You can watch and listen but
              cannot participate with audio or video.
            </p>
          </div>
        )}

        {/* Main Video Area */}
        <main className="flex-1 min-h-0">{children}</main>

        {/* Session Controls */}
        {!isObserver && (
          <SessionControls
            onLeave={onLeave}
            isLeaving={isLoading}
            variant="floating"
          />
        )}
      </div>

      {/* Sidebar */}
      <aside className="w-full lg:w-80 flex-shrink-0">
        <Card className="h-full">
          <Tabs defaultValue="participants" className="h-full flex flex-col">
            <CardHeader className="pb-2">
              <TabsList className="w-full">
                <TabsTrigger value="participants" className="flex-1 gap-2" aria-label="Participants list">
                  <Users className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Participants</span>
                </TabsTrigger>

                {isModuleEnabled('chat') && (
                  <TabsTrigger value="chat" className="flex-1 gap-2" aria-label="Chat messages">
                    <MessageSquare className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Chat</span>
                  </TabsTrigger>
                )}

                {isAIEnabled && (
                  <TabsTrigger value="ai" className="flex-1 gap-2" aria-label="AI Assistant">
                    <Brain className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">AI</span>
                  </TabsTrigger>
                )}

                {isModuleEnabled('transcript') && (
                  <TabsTrigger value="transcript" className="flex-1 gap-2" aria-label="Session transcript">
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Transcript</span>
                  </TabsTrigger>
                )}

                {isComplianceEnabled && canViewComplianceData && (
                  <TabsTrigger value="compliance" className="flex-1 gap-2" aria-label="Compliance monitoring">
                    <Shield className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Compliance</span>
                  </TabsTrigger>
                )}
              </TabsList>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden p-0">
              {/* Participants Tab */}
              <TabsContent value="participants" className="h-full m-0 p-4">
                <ParticipantList maxHeight="calc(100vh - 300px)" />
              </TabsContent>

              {/* Chat Tab */}
              {isModuleEnabled('chat') && (
                <TabsContent value="chat" className="h-full m-0 p-4">
                  <ChatPlaceholder />
                </TabsContent>
              )}

              {/* AI Tab */}
              {isAIEnabled && (
                <TabsContent value="ai" className="h-full m-0 p-4">
                  <AIPanel maxHeight="calc(100vh - 350px)" />
                </TabsContent>
              )}

              {/* Transcript Tab */}
              {isModuleEnabled('transcript') && (
                <TabsContent value="transcript" className="h-full m-0 p-4">
                  <TranscriptPanel maxHeight="calc(100vh - 300px)" />
                </TabsContent>
              )}

              {/* Compliance Tab (Permission-gated, not role-based) */}
              {isComplianceEnabled && canViewComplianceData && (
                <TabsContent value="compliance" className="h-full m-0 p-4">
                  <CompliancePanel maxHeight="calc(100vh - 300px)" />
                </TabsContent>
              )}
            </CardContent>
          </Tabs>
        </Card>
      </aside>
    </div>
  );
}

// =============================================================================
// Placeholder Components
// =============================================================================

function ChatPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-sm font-medium">Chat</p>
      <p className="text-xs text-muted-foreground">Coming soon</p>
    </div>
  );
}
