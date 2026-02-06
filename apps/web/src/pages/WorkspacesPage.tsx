/**
 * Workspaces Page
 * List of all workspaces with management options.
 */

import { useState, useCallback, useDeferredValue, useMemo } from 'react';
import { Plus, FolderKanban, Search, Loader2, X } from 'lucide-react';
import { usePermissions } from '@/features/auth';
import {
  useWorkspaces,
  useDeleteWorkspace,
  WorkspacesGrid,
  CreateWorkspaceDialog,
  WorkspaceDialog,
  type Workspace,
} from '@/features/workspaces';
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
} from '@/shared/ui';

export function WorkspacesPage() {
  const { hasPermission } = usePermissions();
  const [search, setSearch] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null);

  // Defer search for responsive UI during typing
  const deferredSearch = useDeferredValue(search);

  const { workspaces, isLoading, isError, refetch } = useWorkspaces();

  const { deleteWorkspace, isLoading: isDeleting } = useDeleteWorkspace({
    onSuccess: () => {
      setDeleteDialogOpen(false);
      setWorkspaceToDelete(null);
      refetch();
    },
  });

  const handleClearSearch = useCallback(() => {
    setSearch('');
  }, []);

  const handleEditWorkspace = useCallback((workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setEditDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((workspace: Workspace) => {
    setWorkspaceToDelete(workspace);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!workspaceToDelete) return;
    await deleteWorkspace(workspaceToDelete.id);
  }, [workspaceToDelete, deleteWorkspace]);

  // Filter workspaces by search (client-side)
  // Uses deferred search for responsive UI during typing
  const filteredWorkspaces = useMemo(() => {
    if (!deferredSearch) return workspaces;
    const searchLower = deferredSearch.toLowerCase();
    return workspaces.filter((workspace) =>
      workspace.name.toLowerCase().includes(searchLower) ||
      workspace.slug.toLowerCase().includes(searchLower) ||
      workspace.description?.toLowerCase().includes(searchLower)
    );
  }, [workspaces, deferredSearch]);

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search workspaces..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {search && (
          <Button variant="ghost" size="icon" onClick={handleClearSearch}>
            <X className="h-4 w-4" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
        <div className="flex-1" />
        {hasPermission('canEditWorkspace') && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Workspace
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
              Failed to load workspaces
            </CardTitle>
            <CardDescription className="text-center mb-4">
              Something went wrong while fetching workspaces.
            </CardDescription>
            <Button onClick={() => refetch()}>Try again</Button>
          </CardContent>
        </Card>
      )}

      {/* Workspaces Grid */}
      {!isLoading && !isError && filteredWorkspaces.length > 0 && (
        <WorkspacesGrid
          workspaces={filteredWorkspaces}
          onEdit={handleEditWorkspace}
          onDelete={handleDeleteClick}
        />
      )}

      {/* Empty State */}
      {!isLoading && !isError && filteredWorkspaces.length === 0 && (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <FolderKanban className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl mb-2">
              {search ? 'No workspaces found' : 'No workspaces yet'}
            </CardTitle>
            <CardDescription className="text-center max-w-sm mb-6">
              {search
                ? 'Try adjusting your search to find what you are looking for.'
                : 'Create your first workspace to organize your team and sessions.'}
            </CardDescription>
            {hasPermission('canEditWorkspace') && !search && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Workspace
              </Button>
            )}
            {search && (
              <Button variant="outline" onClick={handleClearSearch}>
                Clear search
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Workspace Dialog */}
      <CreateWorkspaceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => refetch()}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Workspace</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{workspaceToDelete?.name}&quot;?
              This action cannot be undone.
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
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Workspace Dialog */}
      {selectedWorkspace && (
        <WorkspaceDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          workspace={selectedWorkspace}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
