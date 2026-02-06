/**
 * Domain Configs Page
 * Admin page for managing domain configurations.
 */

import { useState, useCallback } from 'react';
import { Plus, Settings2, Search, Loader2, X } from 'lucide-react';
import { usePermissions } from '@/features/auth';
import {
  useDomainConfigs,
  useDeleteDomainConfig,
  DomainConfigTable,
  CreateDomainConfigDialog,
  EditDomainConfigDialog,
  domainTypeLabels,
  domainTypeValues,
  type DomainConfig,
  type DomainType,
} from '@/features/domain-configs';
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui';

export function DomainConfigsPage() {
  const { hasPermission } = usePermissions();
  const [search, setSearch] = useState('');
  const [domainTypeFilter, setDomainTypeFilter] = useState<DomainType | 'all'>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<DomainConfig | null>(null);
  const [configToDelete, setConfigToDelete] = useState<DomainConfig | null>(null);
  const [configToDuplicate, setConfigToDuplicate] = useState<DomainConfig | null>(null);

  const { configs, isLoading, isError, refetch } = useDomainConfigs({
    domainType: domainTypeFilter === 'all' ? undefined : domainTypeFilter,
  });

  const { deleteConfig, isLoading: isDeleting } = useDeleteDomainConfig({
    onSuccess: () => {
      setDeleteDialogOpen(false);
      setConfigToDelete(null);
      refetch();
    },
  });

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setDomainTypeFilter('all');
  }, []);

  const handleEditConfig = useCallback((config: DomainConfig) => {
    setSelectedConfig(config);
    setEditDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((config: DomainConfig) => {
    setConfigToDelete(config);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!configToDelete) return;
    await deleteConfig(configToDelete.id);
  }, [configToDelete, deleteConfig]);

  const handleDuplicate = useCallback((config: DomainConfig) => {
    setConfigToDuplicate(config);
    setCreateDialogOpen(true);
  }, []);

  const handleCreateDialogChange = useCallback((open: boolean) => {
    setCreateDialogOpen(open);
    // Clear the duplicate config when dialog closes
    if (!open) {
      setConfigToDuplicate(null);
    }
  }, []);

  const handleCreateNew = useCallback(() => {
    setConfigToDuplicate(null); // Ensure we're not duplicating
    setCreateDialogOpen(true);
  }, []);

  // Filter configs by search (client-side)
  const filteredConfigs = configs.filter((config) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      config.name.toLowerCase().includes(searchLower) ||
      config.domainType.toLowerCase().includes(searchLower)
    );
  });

  const canEdit = hasPermission('canManageDomainConfigs');
  const canDelete = hasPermission('canManageDomainConfigs');
  const hasFilters = search || domainTypeFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Domain Configurations</h1>
          <p className="text-muted-foreground">
            Manage configuration templates for different domain types
          </p>
        </div>
        {canEdit && (
          <Button onClick={handleCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            New Configuration
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search configurations..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={domainTypeFilter}
          onValueChange={(value) => setDomainTypeFilter(value as DomainType | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All domain types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All domain types</SelectItem>
            {domainTypeValues.map((type) => (
              <SelectItem key={type} value={type}>
                {domainTypeLabels[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 motion-safe:animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {isError && (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CardTitle className="text-xl mb-2 text-destructive">
              Failed to load configurations
            </CardTitle>
            <CardDescription className="text-center mb-4">
              Something went wrong while fetching domain configurations.
            </CardDescription>
            <Button onClick={() => refetch()}>Try again</Button>
          </CardContent>
        </Card>
      )}

      {/* Config Table */}
      {!isLoading && !isError && filteredConfigs.length > 0 && (
        <DomainConfigTable
          configs={filteredConfigs}
          onEdit={handleEditConfig}
          onDelete={handleDeleteClick}
          onDuplicate={handleDuplicate}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}

      {/* Empty State */}
      {!isLoading && !isError && filteredConfigs.length === 0 && (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Settings2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl mb-2">
              {hasFilters ? 'No configurations found' : 'No configurations yet'}
            </CardTitle>
            <CardDescription className="text-center max-w-sm mb-6">
              {hasFilters
                ? 'Try adjusting your filters to find what you are looking for.'
                : 'Create your first domain configuration to define session behavior.'}
            </CardDescription>
            {canEdit && !hasFilters && (
              <Button onClick={handleCreateNew}>
                <Plus className="w-4 h-4 mr-2" />
                Create Configuration
              </Button>
            )}
            {hasFilters && (
              <Button variant="outline" onClick={handleClearFilters}>
                Clear filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Dialog (also used for duplicating) */}
      <CreateDomainConfigDialog
        open={createDialogOpen}
        onOpenChange={handleCreateDialogChange}
        onSuccess={() => refetch()}
        initialValues={
          configToDuplicate
            ? {
                name: configToDuplicate.name,
                domainType: configToDuplicate.domainType,
                configJson: configToDuplicate.configJson as Record<string, unknown>,
              }
            : undefined
        }
      />

      {/* Edit Dialog */}
      {selectedConfig && (
        <EditDomainConfigDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          config={selectedConfig}
          onSuccess={() => refetch()}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Configuration</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{configToDelete?.name}&quot;?
              This action cannot be undone. Sessions using this configuration
              will need to be assigned a new one.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
