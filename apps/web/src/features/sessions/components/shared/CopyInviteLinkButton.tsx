/**
 * CopyInviteLinkButton Component
 * Popover with role selector that generates and copies a session invite link.
 *
 * SECURITY: Uses short-lived invite codes instead of embedding access tokens
 * directly in URLs. The code is exchanged for a token when the user opens the link.
 */

import { useState, useCallback } from 'react';
import { Link, Loader2, Copy, Check, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import {
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Label,
} from '@/shared/ui';
import { useSessionInviteInfo } from '../../hooks/useSessionInviteInfo';
import { sessionsService } from '../../api/sessions.service';

interface CopyInviteLinkButtonProps {
  sessionId: string;
  disabled?: boolean;
}

export function CopyInviteLinkButton({
  sessionId,
  disabled = false,
}: CopyInviteLinkButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const { inviteInfo, isLoading, isError, refetch } = useSessionInviteInfo(
    sessionId,
    { enabled: isOpen }
  );

  // Set default role when invite info loads
  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (open) {
        // Reset state when opening
        setCopied(false);
        setSelectedRoleId('');
        // Refetch to get a fresh token
        refetch();
      }
    },
    [refetch]
  );

  // Auto-select first role when roles load
  const firstRole = inviteInfo?.roles?.[0];
  if (firstRole && !selectedRoleId) {
    setSelectedRoleId(firstRole.id);
  }

  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const handleCopyLink = useCallback(async () => {
    if (!inviteInfo || !selectedRoleId) return;

    setIsGeneratingCode(true);
    try {
      // Generate a short-lived invite code for the selected role
      const { code } = await sessionsService.createInviteCode(sessionId, selectedRoleId);

      // Build URL with code instead of raw token (safer for URLs)
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/sessions/${sessionId}/lobby?code=${encodeURIComponent(code)}`;

      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Invite link copied to clipboard');
      setTimeout(() => {
        setCopied(false);
        setIsOpen(false);
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate invite link';
      toast.error(message);
    } finally {
      setIsGeneratingCode(false);
    }
  }, [inviteInfo, selectedRoleId, sessionId]);

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          <Link className="mr-2 h-4 w-4" />
          Copy Invite Link
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Invite Link</h4>
            <p className="text-sm text-muted-foreground">
              Select a role and copy the invite link to share with participants.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 motion-safe:animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="text-sm text-destructive py-2">
              Failed to load invite info. Please try again.
            </div>
          ) : inviteInfo ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="role-select">Role</Label>
                <Select
                  value={selectedRoleId}
                  onValueChange={setSelectedRoleId}
                >
                  <SelectTrigger id="role-select">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {inviteInfo.roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                onClick={handleCopyLink}
                disabled={!selectedRoleId || copied || isGeneratingCode}
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : isGeneratingCode ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </>
                )}
              </Button>
            </>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
