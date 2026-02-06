/**
 * Share Links Tab
 * Displays and manages persistent share links for a session.
 */

import { useState, useCallback } from 'react';
import {
  Link2,
  Plus,
  Copy,
  Check,
  MoreHorizontal,
  Trash2,
  Ban,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ShareLink, ShareLinkStatus } from '../../api/sessions.service';
import { useShareLinks, useUpdateShareLink, useDeleteShareLink } from '../../hooks/useShareLinks';
import { CreateShareLinkDialog } from './CreateShareLinkDialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface RoleOption {
  id: string;
  name: string;
}

interface ShareLinksTabProps {
  sessionId: string;
  roles: RoleOption[];
}

// =============================================================================
// Helpers
// =============================================================================

function getStatusVariant(status: ShareLinkStatus): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'ACTIVE':
      return 'default';
    case 'DISABLED':
      return 'secondary';
    case 'EXPIRED':
      return 'destructive';
  }
}

function formatExpiry(expiresAt: string | null): string {
  if (!expiresAt) return 'Never';
  const date = new Date(expiresAt);
  const now = new Date();
  if (date < now) return 'Expired';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// =============================================================================
// Row Component
// =============================================================================

function ShareLinkRow({
  link,
  roles,
  onCopy,
  onDisable,
  onEnable,
  onDelete,
}: {
  link: ShareLink;
  roles: RoleOption[];
  onCopy: (url: string) => void;
  onDisable: (shareId: string) => void;
  onEnable: (shareId: string) => void;
  onDelete: (shareId: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const roleName = roles.find((r) => r.id === link.roleId)?.name ?? link.roleId;

  const handleCopy = () => {
    onCopy(link.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span className="font-medium text-sm">
            {link.label || `Share link`}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {link.shareId.slice(0, 8)}...
          </span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="capitalize">
          {roleName}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={getStatusVariant(link.status)}>
          {link.status}
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {link.maxUses ? `${link.useCount} / ${link.maxUses}` : link.useCount}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatExpiry(link.expiresAt)}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleCopy}
            title="Copy link"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" />
                Copy link
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => window.open(link.url, '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {link.status === 'ACTIVE' ? (
                <DropdownMenuItem onClick={() => onDisable(link.shareId)}>
                  <Ban className="mr-2 h-4 w-4" />
                  Disable
                </DropdownMenuItem>
              ) : link.status === 'DISABLED' ? (
                <DropdownMenuItem onClick={() => onEnable(link.shareId)}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Re-enable
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(link.shareId)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function ShareLinksTab({ sessionId, roles }: ShareLinksTabProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { shareLinks, isLoading } = useShareLinks(sessionId);
  const { updateShareLink } = useUpdateShareLink(sessionId);
  const { deleteShareLink, isLoading: isDeleting } = useDeleteShareLink(sessionId);

  const handleCopy = useCallback(async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  }, []);

  const handleDisable = useCallback(
    async (shareId: string) => {
      await updateShareLink({ shareId, data: { status: 'DISABLED' } });
    },
    [updateShareLink]
  );

  const handleEnable = useCallback(
    async (shareId: string) => {
      await updateShareLink({ shareId, data: { status: 'ACTIVE' } });
    },
    [updateShareLink]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    await deleteShareLink(deleteTarget);
    setDeleteTarget(null);
  }, [deleteTarget, deleteShareLink]);

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-sm text-muted-foreground">Loading share links...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Share Links</h3>
          <p className="text-sm text-muted-foreground">
            Persistent links that allow participants to join without authentication
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Link
        </Button>
      </div>

      {shareLinks.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12">
            <EmptyState
              icon={<Link2 className={cn('h-12 w-12 text-muted-foreground/50')} />}
              title="No share links"
              description="Create a share link to allow participants to join this session via URL."
              action={
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Share Link
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              {shareLinks.length} share link{shareLinks.length !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Link</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shareLinks.map((link) => (
                  <ShareLinkRow
                    key={link.id}
                    link={link}
                    roles={roles}
                    onCopy={handleCopy}
                    onDisable={handleDisable}
                    onEnable={handleEnable}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <CreateShareLinkDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        sessionId={sessionId}
        roles={roles}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete share link</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the share link. Anyone with this link
              will no longer be able to join the session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
