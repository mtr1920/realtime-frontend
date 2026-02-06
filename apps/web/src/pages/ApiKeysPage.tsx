/**
 * ApiKeysPage
 * Admin page for managing API keys.
 */

import { useState, useCallback } from 'react';
import { Button } from '@/shared/ui';
import { Input } from '@/shared/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui';
import { Skeleton } from '@/shared/ui';
import { Checkbox } from '@/shared/ui';
import { Label } from '@/shared/ui';
import { PermissionGate } from '@/features/auth/components/PermissionGate';
import {
  useApiKeys,
  useRevokeApiKey,
  ApiKeyTable,
  CreateApiKeyDialog,
  EditApiKeyDialog,
  RevokeApiKeyDialog,
  type ApiKey,
} from '@/features/api-keys';
import { showSuccess, handleError } from '@/shared/errors';

export function ApiKeysPage() {
  // Filter state
  const [search, setSearch] = useState('');
  const [includeRevoked, setIncludeRevoked] = useState(false);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingApiKey, setEditingApiKey] = useState<ApiKey | null>(null);
  const [revokingApiKey, setRevokingApiKey] = useState<ApiKey | null>(null);

  // Fetch API keys
  const { apiKeys, isLoading } = useApiKeys({
    search: search || undefined,
    includeRevoked,
    orderBy: 'createdAt',
    orderDirection: 'desc',
  });

  // Revoke mutation
  const { revokeApiKey, isLoading: isRevoking } = useRevokeApiKey({
    onSuccess: () => {
      setRevokingApiKey(null);
      showSuccess('API key revoked successfully');
    },
    onError: (error) => {
      handleError(error, { message: 'Failed to revoke API key' });
    },
  });

  const handleEdit = useCallback((apiKey: ApiKey) => {
    setEditingApiKey(apiKey);
  }, []);

  const handleRevoke = useCallback((apiKey: ApiKey) => {
    setRevokingApiKey(apiKey);
  }, []);

  const handleConfirmRevoke = useCallback(async () => {
    if (revokingApiKey) {
      await revokeApiKey(revokingApiKey.id);
    }
  }, [revokingApiKey, revokeApiKey]);

  return (
    <PermissionGate permission="canManageIntegrations" fallback={<UnauthorizedMessage />}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">API Keys</h1>
            <p className="text-muted-foreground">
              Manage API keys for programmatic access
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            Create API Key
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter API Keys</CardTitle>
            <CardDescription>Search and filter your API keys</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Input
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
                aria-label="Search API keys"
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  id="include-revoked"
                  checked={includeRevoked}
                  onCheckedChange={(checked) => setIncludeRevoked(!!checked)}
                />
                <Label htmlFor="include-revoked" className="text-sm cursor-pointer">
                  Show revoked keys
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Keys List */}
        <Card>
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>
              {apiKeys.length} key{apiKeys.length !== 1 ? 's' : ''} configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ApiKeysSkeleton />
            ) : (
              <ApiKeyTable
                apiKeys={apiKeys}
                isLoading={isLoading}
                onEdit={handleEdit}
                onRevoke={handleRevoke}
              />
            )}
          </CardContent>
        </Card>

        {/* Dialogs */}
        <CreateApiKeyDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
        />

        <EditApiKeyDialog
          apiKey={editingApiKey}
          open={!!editingApiKey}
          onOpenChange={(open) => !open && setEditingApiKey(null)}
        />

        <RevokeApiKeyDialog
          apiKey={revokingApiKey}
          open={!!revokingApiKey}
          onOpenChange={(open) => !open && setRevokingApiKey(null)}
          onConfirm={handleConfirmRevoke}
          isLoading={isRevoking}
        />
      </div>
    </PermissionGate>
  );
}

function ApiKeysSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={`skeleton-${i}`} className="h-16 w-full" />
      ))}
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
            You don't have permission to manage API keys.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
