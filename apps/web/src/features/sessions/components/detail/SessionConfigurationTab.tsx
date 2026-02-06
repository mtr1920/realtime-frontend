/**
 * Session Configuration Tab
 * Visual display of the session's config snapshot.
 */

import {
  Video,
  Mic,
  Brain,
  Shield,
  Monitor,
  FileText,
  Check,
  X,
  Settings,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Separator,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

interface ModuleConfig {
  enabled: boolean;
  [key: string]: unknown;
}

interface ConfigSnapshot {
  roleId?: string;
  roleName?: string;
  roleDescription?: string;
  classification?: {
    isPrimary?: boolean;
    isFacilitator?: boolean;
    isSpectator?: boolean;
    isAiAgent?: boolean;
  };
  modules?: {
    recording?: ModuleConfig & {
      autoStart?: boolean;
      consentType?: string;
    };
    transcription?: ModuleConfig & {
      realtime?: boolean;
      language?: string;
    };
    ai?: ModuleConfig & {
      provider?: string;
      behavior?: string;
    };
    compliance?: ModuleConfig & {
      lockdownMode?: boolean;
      verification?: boolean;
    };
    screenShare?: ModuleConfig & {
      required?: boolean;
      displaySurfaces?: string[];
    };
    outcomes?: ModuleConfig & {
      summary?: boolean;
      evaluation?: boolean;
      decision?: boolean;
    };
  };
  permissions?: Record<string, boolean>;
  sessionDefaults?: {
    durationMinutes?: number;
    timeoutMinutes?: number;
    maxParticipants?: number;
  };
  meta?: {
    persona?: {
      name?: string;
      description?: string;
    };
    organization?: {
      name?: string;
    };
    locale?: {
      language?: string;
      timezone?: string;
    };
  };
}

interface SessionConfigurationTabProps {
  configSnapshot: ConfigSnapshot | null;
}

interface ModuleCardProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
  children?: React.ReactNode;
}

function ModuleCard({ title, icon: Icon, enabled, children }: ModuleCardProps) {
  return (
    <Card
      className={cn(
        'transition-opacity',
        !enabled && 'opacity-60'
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </div>
          <Badge variant={enabled ? 'default' : 'secondary'}>
            {enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
      </CardHeader>
      {enabled && children && (
        <CardContent className="pt-2">
          {children}
        </CardContent>
      )}
    </Card>
  );
}

function ConfigItem({
  label,
  value,
  boolean,
}: {
  label: string;
  value?: string | number | boolean | null;
  boolean?: boolean;
}) {
  if (boolean) {
    return (
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        {value ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <X className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value ?? '-'}</span>
    </div>
  );
}

export function SessionConfigurationTab({ configSnapshot }: SessionConfigurationTabProps) {
  if (!configSnapshot) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center text-muted-foreground">
          <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No configuration data available</p>
        </div>
      </div>
    );
  }

  const { classification, modules, permissions, sessionDefaults, meta } = configSnapshot;

  return (
    <div className="space-y-6">
      {/* Role Info */}
      {(configSnapshot.roleName || configSnapshot.roleDescription) && (
        <Card>
          <CardHeader>
            <CardTitle>Role Information</CardTitle>
            {configSnapshot.roleDescription && (
              <CardDescription>{configSnapshot.roleDescription}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <ConfigItem label="Role ID" value={configSnapshot.roleId} />
            <ConfigItem label="Role Name" value={configSnapshot.roleName} />
            {classification && (
              <>
                <Separator />
                <div className="flex flex-wrap gap-2">
                  {classification.isPrimary && (
                    <Badge variant="outline">Primary</Badge>
                  )}
                  {classification.isFacilitator && (
                    <Badge variant="outline">Facilitator</Badge>
                  )}
                  {classification.isSpectator && (
                    <Badge variant="outline">Spectator</Badge>
                  )}
                  {classification.isAiAgent && (
                    <Badge variant="outline">AI Agent</Badge>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modules */}
      {modules && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Modules</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Recording */}
            <ModuleCard
              title="Recording"
              icon={Video}
              enabled={modules.recording?.enabled ?? false}
            >
              <div className="space-y-2">
                <ConfigItem label="Auto-start" value={modules.recording?.autoStart} boolean />
                <ConfigItem label="Consent Type" value={modules.recording?.consentType} />
              </div>
            </ModuleCard>

            {/* Transcription */}
            <ModuleCard
              title="Transcription"
              icon={Mic}
              enabled={modules.transcription?.enabled ?? false}
            >
              <div className="space-y-2">
                <ConfigItem label="Realtime" value={modules.transcription?.realtime} boolean />
                <ConfigItem label="Language" value={modules.transcription?.language} />
              </div>
            </ModuleCard>

            {/* AI */}
            <ModuleCard
              title="AI"
              icon={Brain}
              enabled={modules.ai?.enabled ?? false}
            >
              <div className="space-y-2">
                <ConfigItem label="Provider" value={modules.ai?.provider} />
                <ConfigItem label="Behavior" value={modules.ai?.behavior} />
              </div>
            </ModuleCard>

            {/* Compliance */}
            <ModuleCard
              title="Compliance"
              icon={Shield}
              enabled={modules.compliance?.enabled ?? false}
            >
              <div className="space-y-2">
                <ConfigItem label="Lockdown Mode" value={modules.compliance?.lockdownMode} boolean />
                <ConfigItem label="Verification" value={modules.compliance?.verification} boolean />
              </div>
            </ModuleCard>

            {/* Screen Share */}
            <ModuleCard
              title="Screen Share"
              icon={Monitor}
              enabled={modules.screenShare?.enabled ?? false}
            >
              <div className="space-y-2">
                <ConfigItem label="Required" value={modules.screenShare?.required} boolean />
                {modules.screenShare?.displaySurfaces && (
                  <div className="flex flex-wrap gap-1">
                    {modules.screenShare.displaySurfaces.map((surface) => (
                      <Badge key={surface} variant="secondary" className="text-xs">
                        {surface}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </ModuleCard>

            {/* Outcomes */}
            <ModuleCard
              title="Outcomes"
              icon={FileText}
              enabled={modules.outcomes?.enabled ?? false}
            >
              <div className="space-y-2">
                <ConfigItem label="Summary" value={modules.outcomes?.summary} boolean />
                <ConfigItem label="Evaluation" value={modules.outcomes?.evaluation} boolean />
                <ConfigItem label="Decision" value={modules.outcomes?.decision} boolean />
              </div>
            </ModuleCard>
          </div>
        </div>
      )}

      {/* Permissions */}
      {permissions && Object.keys(permissions).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(permissions).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 text-sm">
                  {value ? (
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className={cn(!value && 'text-muted-foreground')}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Defaults */}
      {sessionDefaults && (
        <Card>
          <CardHeader>
            <CardTitle>Session Defaults</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ConfigItem
              label="Duration"
              value={sessionDefaults.durationMinutes ? `${sessionDefaults.durationMinutes} minutes` : undefined}
            />
            <ConfigItem
              label="Timeout"
              value={sessionDefaults.timeoutMinutes ? `${sessionDefaults.timeoutMinutes} minutes` : undefined}
            />
            <ConfigItem label="Max Participants" value={sessionDefaults.maxParticipants} />
          </CardContent>
        </Card>
      )}

      {/* Meta */}
      {meta && (
        <Card>
          <CardHeader>
            <CardTitle>Meta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {meta.persona && (
              <>
                <ConfigItem label="Persona Name" value={meta.persona.name} />
                <ConfigItem label="Persona Description" value={meta.persona.description} />
              </>
            )}
            {meta.organization && (
              <ConfigItem label="Organization" value={meta.organization.name} />
            )}
            {meta.locale && (
              <>
                <ConfigItem label="Language" value={meta.locale.language} />
                <ConfigItem label="Timezone" value={meta.locale.timezone} />
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
