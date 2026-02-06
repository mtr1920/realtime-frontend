/**
 * TenantSettingsPage
 * Admin page for managing tenant settings.
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui';
import { Skeleton } from '@/shared/ui';
import { Badge } from '@/shared/ui';
import { PermissionGate } from '@/features/auth/components/PermissionGate';
import { useCurrentUser } from '@/shared/hooks';
import {
  useTenant,
  useUpdateTenant,
  GeneralSettingsForm,
  BrandingSettingsForm,
  LimitsDisplay,
  FeaturesDisplay,
  tenantStatusLabels,
  type UpdateTenantFormData,
} from '@/features/tenant-settings';
import { showSuccess, handleError } from '@/shared/errors';

type SettingsTab = 'general' | 'branding' | 'limits' | 'features';

export function TenantSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const { user } = useCurrentUser();
  const tenantId = user?.tenantId ?? null;

  // Fetch tenant
  const { tenant, isLoading } = useTenant(tenantId);

  // Update mutation
  const { updateTenant, isLoading: isUpdating } = useUpdateTenant({
    onSuccess: () => {
      showSuccess('Settings updated successfully');
    },
    onError: (error) => {
      handleError(error, { message: 'Failed to update settings' });
    },
  });

  const handleUpdateSettings = useCallback(
    async (data: UpdateTenantFormData) => {
      if (!tenantId) return;
      await updateTenant({ tenantId, data });
    },
    [tenantId, updateTenant]
  );

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'branding', label: 'Branding' },
    { id: 'limits', label: 'Limits' },
    { id: 'features', label: 'Features' },
  ];

  return (
    <PermissionGate permission="canAccessAdmin" fallback={<UnauthorizedMessage />}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tenant Settings</h1>
            <p className="text-muted-foreground">
              Manage your organization's settings and configuration
            </p>
          </div>
          {tenant && (
            <Badge
              variant={tenant.status === 'active' ? 'success' : 'secondary'}
              aria-label={`Tenant status: ${tenant.status}`}
            >
              {tenantStatusLabels[tenant.status]}
            </Badge>
          )}
        </div>

        {isLoading ? (
          <SettingsSkeleton />
        ) : tenant ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {/* Sidebar */}
            <Card className="lg:col-span-1 h-fit">
              <CardHeader>
                <CardTitle className="text-lg">Settings</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="flex flex-col" role="tablist" aria-label="Settings tabs">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      role="tab"
                      aria-selected={activeTab === tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-3 text-left text-sm transition-colors hover:bg-muted/50 ${
                        activeTab === tab.id
                          ? 'border-l-2 border-primary bg-muted/30 font-medium'
                          : 'border-l-2 border-transparent'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>

            {/* Content */}
            <div className="lg:col-span-3">
              {activeTab === 'general' && (
                <Card>
                  <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>
                      Basic organization settings and defaults
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <GeneralSettingsForm
                      tenant={tenant}
                      onSubmit={handleUpdateSettings}
                      isLoading={isUpdating}
                    />
                  </CardContent>
                </Card>
              )}

              {activeTab === 'branding' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Branding</CardTitle>
                    <CardDescription>
                      Customize the appearance of your platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BrandingSettingsForm
                      tenant={tenant}
                      onSubmit={handleUpdateSettings}
                      isLoading={isUpdating}
                    />
                  </CardContent>
                </Card>
              )}

              {activeTab === 'limits' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Usage Limits</CardTitle>
                    <CardDescription>
                      Resource limits based on your subscription
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LimitsDisplay limits={tenant.limits} />
                  </CardContent>
                </Card>
              )}

              {activeTab === 'features' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Features</CardTitle>
                    <CardDescription>
                      Enabled features on your subscription
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FeaturesDisplay features={tenant.features} />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-lg font-medium">Tenant not found</p>
              <p className="text-muted-foreground">
                Unable to load tenant settings.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PermissionGate>
  );
}

function SettingsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <Skeleton className="h-64 lg:col-span-1" />
      <Skeleton className="h-96 lg:col-span-3" />
    </div>
  );
}

function UnauthorizedMessage() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-lg font-medium">Access Denied</p>
          <p className="text-muted-foreground">
            You don't have permission to manage tenant settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
