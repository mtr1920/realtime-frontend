/**
 * Create Share Link Dialog
 * Form dialog for generating a persistent share link for a session.
 */

import { useState } from 'react';
import { Link2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { ShareLink } from '../../api/sessions.service';
import { useCreateShareLink } from '../../hooks/useShareLinks';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui';
import { SubmitButton } from '@/shared/components';

interface RoleOption {
  id: string;
  name: string;
}

interface CreateShareLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  roles: RoleOption[];
  defaultRoleId?: string;
}

export function CreateShareLinkDialog({
  open,
  onOpenChange,
  sessionId,
  roles,
  defaultRoleId,
}: CreateShareLinkDialogProps) {
  const [roleId, setRoleId] = useState(defaultRoleId ?? roles[0]?.id ?? '');
  const [label, setLabel] = useState('');
  const [maxUses, setMaxUses] = useState<string>('');
  const [expiresInHours, setExpiresInHours] = useState<string>('');
  const [createdLink, setCreatedLink] = useState<ShareLink | null>(null);
  const [copied, setCopied] = useState(false);

  const { createShareLink, isLoading } = useCreateShareLink(sessionId, {
    onSuccess: (link) => {
      setCreatedLink(link);
    },
  });

  const handleCreate = async () => {
    const shareId = crypto.randomUUID();
    const expiresAt = expiresInHours
      ? new Date(Date.now() + parseInt(expiresInHours) * 3600_000).toISOString()
      : undefined;

    await createShareLink({
      shareId,
      roleId,
      label: label || undefined,
      maxUses: maxUses ? parseInt(maxUses) : undefined,
      expiresAt,
    });
  };

  const handleCopy = async () => {
    if (!createdLink) return;
    await navigator.clipboard.writeText(createdLink.url);
    setCopied(true);
    toast.success('Share link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after animation
    setTimeout(() => {
      setRoleId(defaultRoleId ?? roles[0]?.id ?? '');
      setLabel('');
      setMaxUses('');
      setExpiresInHours('');
      setCreatedLink(null);
      setCopied(false);
    }, 200);
  };

  // Show created link view
  if (createdLink) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-green-500" />
              Share Link Created
            </DialogTitle>
            <DialogDescription>
              Copy this link and share it with participants. They can join the
              session without authentication.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={createdLink.url}
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            {createdLink.label && (
              <p className="text-sm text-muted-foreground">
                Label: {createdLink.label}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button onClick={handleClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Create Share Link
          </DialogTitle>
          <DialogDescription>
            Generate a persistent link that allows participants to join this
            session without authentication.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="share-role">Role</Label>
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              The role assigned to users who join via this link
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="share-label">Label (optional)</Label>
            <Input
              id="share-label"
              placeholder='e.g., "Candidate Link", "Observer Link"'
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="share-expiry">Expiry</Label>
            <Select value={expiresInHours} onValueChange={setExpiresInHours}>
              <SelectTrigger>
                <SelectValue placeholder="No expiry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No expiry</SelectItem>
                <SelectItem value="1">1 hour</SelectItem>
                <SelectItem value="4">4 hours</SelectItem>
                <SelectItem value="24">24 hours</SelectItem>
                <SelectItem value="168">7 days</SelectItem>
                <SelectItem value="720">30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="share-max-uses">Max uses (optional)</Label>
            <Input
              id="share-max-uses"
              type="number"
              min={1}
              placeholder="Unlimited"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Limit how many times this link can be used
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <SubmitButton onClick={handleCreate} disabled={!roleId} isLoading={isLoading}>
            Create Link
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
