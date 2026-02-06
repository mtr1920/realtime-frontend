/**
 * Workspaces Feature
 * Public exports for the workspaces module.
 */

// API Service
export {
  workspacesService,
  type Workspace,
  type WorkspaceListParams,
  type CreateWorkspaceInput,
  type UpdateWorkspaceInput,
  type PaginatedWorkspacesResponse,
  type CursorPagination,
} from './api/workspaces.service';

// Hooks
export { useWorkspaces } from './hooks/useWorkspaces';
export { useWorkspace } from './hooks/useWorkspace';
export { useCreateWorkspace } from './hooks/useCreateWorkspace';
export { useUpdateWorkspace } from './hooks/useUpdateWorkspace';
export { useDeleteWorkspace } from './hooks/useDeleteWorkspace';

// Components
export { WorkspaceCard } from './components/WorkspaceCard';
export { WorkspacesGrid } from './components/WorkspacesGrid';
export { CreateWorkspaceDialog } from './components/CreateWorkspaceDialog';
export { WorkspaceDialog } from './components/WorkspaceDialog';

// Schemas
export {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  workspaceFiltersSchema,
  type CreateWorkspaceFormData,
  type UpdateWorkspaceFormData,
  type WorkspaceFiltersFormData,
} from './schemas/workspace.schema';
