/**
 * Workspaces Grid
 * Grid layout for displaying workspace cards.
 */

import { FolderKanban } from 'lucide-react';
import type { Workspace } from '../api/workspaces.service';
import { WorkspaceCard } from './WorkspaceCard';
import { Skeleton } from '@/shared/ui';
import { EmptyState } from '@/shared/ui';

interface WorkspacesGridProps {
  workspaces: Workspace[];
  isLoading?: boolean;
  onEdit?: (workspace: Workspace) => void;
  onDelete?: (workspace: Workspace) => void;
}

export function WorkspacesGrid({
  workspaces,
  isLoading,
  onEdit,
  onDelete,
}: WorkspacesGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={`skeleton-${i}`} className="rounded-lg border p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-12 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <EmptyState
        icon={<FolderKanban className="h-6 w-6 text-muted-foreground" />}
        title="No workspaces yet"
        description="Create your first workspace to organize your sessions."
      />
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {workspaces.map((workspace, index) => (
        <WorkspaceCard
          key={workspace.id}
          workspace={workspace}
          index={index}
          onEdit={onEdit}
          onDelete={onDelete}
          className="motion-safe:animate-slide-up-fade"
        />
      ))}
    </div>
  );
}
