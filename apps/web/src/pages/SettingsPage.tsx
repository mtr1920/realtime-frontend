/**
 * Settings Page
 * User settings and preferences.
 */

import { useState, useRef } from 'react';
import { User, Bell, Shield, Palette, Camera, Loader2 } from 'lucide-react';
import { useTheme } from '@/shared/theme/useTheme';
import { useCurrentUser } from '@/shared/hooks';
import { useUpdateUser } from '@/features/users';
import { uploadService } from '@/shared/services';
import { handleError } from '@/shared/errors';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  UserAvatar,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@/shared/ui';

interface SettingsSectionProps {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

function SettingsSection({ title, description, icon: Icon, children }: SettingsSectionProps) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, invalidate: invalidateUser } = useCurrentUser();
  const { updateUser, isLoading: isSaving } = useUpdateUser();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    try {
      let avatarUrl: string | undefined;

      // Upload avatar if a new one was selected
      if (avatarPreview) {
        setIsUploadingAvatar(true);
        try {
          const uploadResult = await uploadService.uploadAvatar(avatarPreview);
          avatarUrl = uploadResult.url;
        } catch (error) {
          handleError(error, { message: 'Failed to upload avatar' });
          setIsUploadingAvatar(false);
          return;
        }
        setIsUploadingAvatar(false);
      }

      // Update user via API
      await updateUser({
        id: user.id,
        data: {
          name: displayName || undefined,
          avatarUrl: avatarUrl,
        },
      });

      // Invalidate user cache to refetch updated data
      await invalidateUser();

      setIsEditProfileOpen(false);
      setAvatarPreview(null);
    } catch {
      // Error handling is done by useMutationWithToast
    }
  };

  return (
    <div className="space-y-4">
      {/* Profile Section */}
      <SettingsSection
        title="Profile"
        description="Your personal information"
        icon={User}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <UserAvatar
              src={user?.avatarUrl}
              alt={user?.displayName}
              size="xl"
            />
            <div className="min-w-0">
              <p className="font-medium truncate">{user?.displayName || 'User Name'}</p>
              <p className="text-sm text-muted-foreground truncate">{user?.email || 'user@example.com'}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="shrink-0"
            onClick={() => {
              setDisplayName(user?.displayName || '');
              setIsEditProfileOpen(true);
            }}
          >
            Edit Profile
          </Button>
        </div>
      </SettingsSection>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditProfileOpen} onOpenChange={(open) => {
        setIsEditProfileOpen(open);
        if (!open) setAvatarPreview(null);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your personal information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <UserAvatar
                  src={avatarPreview || user?.avatarUrl}
                  alt={user?.displayName}
                  size="xl"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Click the camera icon to upload a new photo
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditProfileOpen(false)} disabled={isUploadingAvatar || isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} disabled={isUploadingAvatar || isSaving}>
              {(isUploadingAvatar || isSaving) && <Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" />}
              {isUploadingAvatar ? 'Uploading...' : isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appearance Section */}
      <SettingsSection
        title="Appearance"
        description="Customize how the app looks"
        icon={Palette}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Theme</p>
              <p className="text-sm text-muted-foreground">
                Select your preferred theme
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
              >
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
              >
                Dark
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('system')}
              >
                System
              </Button>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Notifications Section */}
      <SettingsSection
        title="Notifications"
        description="Configure how you receive notifications"
        icon={Bell}
      >
        <p className="text-sm text-muted-foreground">
          Notification settings will be available soon.
        </p>
      </SettingsSection>

      {/* Security Section */}
      <SettingsSection
        title="Security"
        description="Password and security settings"
        icon={Shield}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Password</p>
            <p className="text-sm text-muted-foreground">
              Last changed 30 days ago
            </p>
          </div>
          <Button variant="outline">Change Password</Button>
        </div>
      </SettingsSection>
    </div>
  );
}
