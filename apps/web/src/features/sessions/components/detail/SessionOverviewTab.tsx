/**
 * Session Overview Tab
 *
 * Session detail view with balanced layout showing:
 * - Status timeline with time info
 * - Quick stats
 * - Session details in organized sections
 */

import { useState } from 'react';
import {
  Clock,
  Users,
  Activity,
  Video,
  FileText,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Building2,
  Hash,
  Timer,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Session } from '../../api/sessions.service';
import { SessionStatusTimeline } from './SessionStatusTimeline';
import { SessionStatusBadge } from '../shared/SessionStatusBadge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface SessionOverviewTabProps {
  session: Session;
}

// =============================================================================
// Helper Components
// =============================================================================

/**
 * Copyable field with icon feedback
 */
function CopyableField({
  label,
  value,
  displayValue,
  icon: Icon,
}: {
  label: string;
  value: string;
  displayValue?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label} copied`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between py-2 group">
      <span className="text-sm text-muted-foreground flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium font-mono bg-muted/50 px-2 py-0.5 rounded">
          {displayValue || value}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}

/**
 * Stat card with icon and value
 */
function StatCard({
  icon: Icon,
  label,
  value,
  color = 'default',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color?: 'default' | 'success' | 'warning' | 'primary';
}) {
  const colorClasses = {
    default: 'from-muted/80 to-muted/40 text-muted-foreground',
    success: 'from-green-500/20 to-emerald-500/10 text-green-600 dark:text-green-400',
    warning: 'from-amber-500/20 to-yellow-500/10 text-amber-600 dark:text-amber-400',
    primary: 'from-primary/20 to-primary/10 text-primary',
  };

  return (
    <div
      className={cn(
        'relative p-3 rounded-xl bg-gradient-to-br border border-border/50',
        'hover:shadow-md hover:border-border transition-all duration-200',
        colorClasses[color]
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'p-1.5 rounded-lg bg-background/80 shadow-sm',
            color !== 'default' && 'ring-1 ring-current/20'
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-lg font-bold text-foreground">{value}</div>
          <div className="text-xs text-muted-foreground -mt-0.5">{label}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Info row with label and value
 */
function InfoRow({
  label,
  value,
  icon: Icon,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </span>
      <span className={cn('text-sm font-medium', valueClassName)}>{value}</span>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function SessionOverviewTab({ session }: SessionOverviewTabProps) {
  const [metadataOpen, setMetadataOpen] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  };

  const getExpiryCountdown = () => {
    const now = new Date();
    const expires = new Date(session.expiresAt);
    const diffMs = expires.getTime() - now.getTime();

    if (diffMs < 0) {
      return { text: 'Expired', isExpired: true, urgency: 'expired' as const };
    }

    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    let text = '';
    let urgency: 'safe' | 'warning' | 'urgent' = 'safe';

    if (diffDays > 0) {
      text = `${diffDays}d ${diffHours % 24}h`;
    } else if (diffHours > 0) {
      text = `${diffHours}h ${diffMinutes % 60}m`;
      if (diffHours < 2) urgency = 'warning';
    } else {
      text = `${diffMinutes}m`;
      urgency = diffMinutes < 15 ? 'urgent' : 'warning';
    }

    return { text, isExpired: false, urgency };
  };

  const expiryInfo = getExpiryCountdown();
  const hasMetadata = session.metadata && Object.keys(session.metadata).length > 0;

  return (
    <div className="space-y-4">
      {/* Top Row: Status Timeline + Time Remaining */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Status Timeline - spans 2 columns */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Session Progress
              </CardTitle>
              <SessionStatusBadge status={session.status} size="lg" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <SessionStatusTimeline status={session.status} />

            {/* Timeline details - inline */}
            <div className="mt-4 pt-3 border-t flex flex-wrap gap-x-6 gap-y-2">
              <div>
                <div className="text-xs text-muted-foreground">Created</div>
                <div className="text-sm font-medium">{formatDate(session.createdAt)}</div>
                <div className="text-xs text-muted-foreground">{formatTime(session.createdAt)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Expires</div>
                <div
                  className={cn(
                    'text-sm font-medium',
                    expiryInfo.urgency === 'expired' && 'text-destructive',
                    expiryInfo.urgency === 'urgent' && 'text-amber-600 dark:text-amber-400',
                    expiryInfo.urgency === 'warning' && 'text-amber-500'
                  )}
                >
                  {expiryInfo.isExpired ? 'Expired' : expiryInfo.text}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Remaining Card */}
        <Card
          className={cn(
            'glass-card relative overflow-hidden',
            expiryInfo.urgency === 'urgent' && 'ring-2 ring-amber-500/50',
            expiryInfo.urgency === 'expired' && 'ring-2 ring-destructive/50'
          )}
        >
          <div
            className={cn(
              'absolute inset-0 opacity-10',
              expiryInfo.urgency === 'safe' && 'bg-gradient-to-br from-green-500 to-emerald-500',
              expiryInfo.urgency === 'warning' && 'bg-gradient-to-br from-amber-500 to-yellow-500',
              expiryInfo.urgency === 'urgent' && 'bg-gradient-to-br from-orange-500 to-red-500',
              expiryInfo.urgency === 'expired' && 'bg-gradient-to-br from-red-500 to-rose-500'
            )}
          />
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-base flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Time Remaining
            </CardTitle>
          </CardHeader>
          <CardContent className="relative pt-0">
            <div className="flex flex-col items-center justify-center py-3">
              <div
                className={cn(
                  'text-3xl font-bold',
                  expiryInfo.urgency === 'safe' && 'text-green-600 dark:text-green-400',
                  expiryInfo.urgency === 'warning' && 'text-amber-600 dark:text-amber-400',
                  expiryInfo.urgency === 'urgent' && 'text-orange-600 dark:text-orange-400',
                  expiryInfo.urgency === 'expired' && 'text-destructive'
                )}
              >
                {expiryInfo.text}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {expiryInfo.isExpired ? 'Session expired' : 'until expiration'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Users}
          label="Participants"
          value={session.participantCount}
          color={session.participantCount > 0 ? 'success' : 'default'}
        />
        <StatCard icon={Activity} label="Events" value="-" color="default" />
        <StatCard icon={Video} label="Recordings" value="-" color="default" />
        <StatCard icon={FileText} label="Outcome" value="-" color="default" />
      </div>

      {/* Bottom Row: Session Details + Configuration */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Session Identifiers */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-primary" />
              Session Identifiers
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 divide-y divide-border/50">
            <CopyableField
              label="Session ID"
              value={session.id}
              displayValue={`${session.id.slice(0, 12)}...`}
              icon={Hash}
            />
            {session.externalId && (
              <CopyableField
                label="External ID"
                value={session.externalId}
                icon={ExternalLink}
              />
            )}
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 divide-y divide-border/50">
            <InfoRow
              label="Workspace"
              value={
                <Badge variant="outline" className="font-mono">
                  {session.workspaceId.slice(0, 8)}
                </Badge>
              }
              icon={Building2}
            />
            <InfoRow
              label="Domain Type"
              value={
                <Badge className="capitalize bg-primary/10 text-primary hover:bg-primary/20">
                  {session.domainType}
                </Badge>
              }
            />
            <InfoRow
              label="Expires"
              value={
                <span
                  className={cn(
                    expiryInfo.isExpired && 'text-destructive',
                    expiryInfo.urgency === 'urgent' && 'text-amber-600 dark:text-amber-400'
                  )}
                >
                  {expiryInfo.isExpired ? 'Expired' : expiryInfo.text}
                </span>
              }
              icon={Clock}
            />
          </CardContent>
        </Card>
      </div>

      {/* Metadata Section - Collapsible */}
      {hasMetadata && (
        <Collapsible open={metadataOpen} onOpenChange={setMetadataOpen}>
          <Card className="glass-card">
            <CardHeader className="py-3">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-0 h-auto hover:bg-transparent"
                >
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Custom Metadata
                    <Badge variant="secondary" className="ml-2">
                      {Object.keys(session.metadata || {}).length} fields
                    </Badge>
                  </CardTitle>
                  {metadataOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <pre className="text-xs bg-muted/50 p-4 rounded-lg overflow-auto max-h-48 border">
                  {JSON.stringify(session.metadata, null, 2)}
                </pre>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>
  );
}
