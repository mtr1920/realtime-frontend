/**
 * AIActorForm Component
 *
 * Tabbed form for creating/editing AI actor profiles.
 * Sections: Basic Info, Persona, Voice, Avatar
 */

import { forwardRef, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, User, MessageSquare, Volume2, Palette, Play } from 'lucide-react';
import {
  Button,
  Input,
  Label,
  Textarea,
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Slider,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import {
  aiActorSchema,
  defaultAIActor,
  aiActorRoles,
  personaStyles,
  personaTraits,
  avatarTypes,
  voiceGenders,
  roleLabels,
  styleLabels,
  traitLabels,
  avatarTypeLabels,
  type AIActorFormData,
} from '../schemas/actor.schema';
import type { AIActor } from '../types/actor.types';

// =============================================================================
// Types
// =============================================================================

interface AIActorFormProps {
  /** Mode of the form */
  mode: 'create' | 'edit';
  /** Initial actor data (for edit mode) */
  actor?: AIActor;
  /** Callback when form is submitted */
  onSubmit: (data: AIActorFormData) => Promise<void>;
  /** Callback when form is cancelled */
  onCancel: () => void;
  /** Whether form is in loading state */
  isLoading?: boolean;
  /** Available voice options */
  voiceOptions?: Array<{ id: string; name: string; gender?: 'male' | 'female' | 'neutral' }>;
  /** Callback to preview voice */
  onPreviewVoice?: (voiceId: string) => void;
  /** Additional class name */
  className?: string;
}

// =============================================================================
// Color Picker Component
// =============================================================================

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  id: string;
  disabled?: boolean;
}

function ColorPicker({ value, onChange, label, id, disabled }: ColorPickerProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          id={id}
          value={value || '#6366f1'}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-10 w-10 rounded border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#6366f1"
          className="font-mono text-sm"
          disabled={disabled}
        />
      </div>
    </div>
  );
}

// =============================================================================
// Default Voice Options
// =============================================================================

const defaultVoiceOptions = [
  { id: 'alloy', name: 'Alloy', gender: 'neutral' as const },
  { id: 'echo', name: 'Echo', gender: 'male' as const },
  { id: 'fable', name: 'Fable', gender: 'neutral' as const },
  { id: 'onyx', name: 'Onyx', gender: 'male' as const },
  { id: 'nova', name: 'Nova', gender: 'female' as const },
  { id: 'shimmer', name: 'Shimmer', gender: 'female' as const },
];

// =============================================================================
// Component
// =============================================================================

export const AIActorForm = forwardRef<HTMLFormElement, AIActorFormProps>(
  (
    {
      mode,
      actor,
      onSubmit,
      onCancel,
      isLoading = false,
      voiceOptions = defaultVoiceOptions,
      onPreviewVoice,
      className,
    },
    ref
  ) => {
    const {
      register,
      control,
      handleSubmit,
      watch,
      setValue,
      formState: { errors },
    } = useForm<AIActorFormData>({
      resolver: zodResolver(aiActorSchema),
      defaultValues: actor
        ? {
            id: actor.id,
            name: actor.name,
            role: actor.role,
            persona: actor.persona,
            voice: actor.voice,
            avatar: actor.avatar,
            isActive: actor.isActive,
          }
        : defaultAIActor,
    });

    const avatarType = watch('avatar.type');
    const selectedVoiceId = watch('voice.voiceId');

    const handleVoiceSelect = useCallback(
      (voiceId: string) => {
        const voice = voiceOptions.find((v) => v.id === voiceId);
        if (voice) {
          setValue('voice.voiceId', voice.id);
          setValue('voice.voiceName', voice.name);
          if (voice.gender) {
            setValue('voice.gender', voice.gender);
          }
        }
      },
      [voiceOptions, setValue]
    );

    return (
      <form
        ref={ref}
        onSubmit={handleSubmit(onSubmit)}
        className={cn('space-y-6', className)}
      >
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Basic</span>
            </TabsTrigger>
            <TabsTrigger value="persona" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Persona</span>
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              <span className="hidden sm:inline">Voice</span>
            </TabsTrigger>
            <TabsTrigger value="avatar" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Avatar</span>
            </TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="AI Assistant"
                {...register('name')}
                className={cn(errors.name && 'border-destructive')}
                aria-invalid={!!errors.name}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">
                Role <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {aiActorRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {roleLabels[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && (
                <p className="text-sm text-destructive">{errors.role.message}</p>
              )}
            </div>

            {mode === 'edit' && (
              <div className="flex items-center space-x-2 pt-2">
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="isActive"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  )}
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Actor is active
                </Label>
              </div>
            )}
          </TabsContent>

          {/* Persona Tab */}
          <TabsContent value="persona" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the AI actor's personality and behavior..."
                {...register('persona.description')}
                className={cn(
                  'min-h-[100px]',
                  errors.persona?.description && 'border-destructive'
                )}
                disabled={isLoading}
              />
              {errors.persona?.description && (
                <p className="text-sm text-destructive">
                  {errors.persona.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="style">Communication Style</Label>
              <Controller
                name="persona.style"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="style">
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      {personaStyles.map((style) => (
                        <SelectItem key={style} value={style}>
                          {styleLabels[style]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>
                Personality Traits <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="persona.traits"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {personaTraits.map((trait) => (
                      <label
                        key={trait}
                        className={cn(
                          'flex items-center gap-2 p-2 rounded-md border cursor-pointer',
                          'hover:bg-accent transition-colors',
                          field.value.includes(trait) && 'border-primary bg-primary/5'
                        )}
                      >
                        <Checkbox
                          checked={field.value.includes(trait)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              field.onChange([...field.value, trait]);
                            } else {
                              field.onChange(field.value.filter((t) => t !== trait));
                            }
                          }}
                          disabled={isLoading}
                        />
                        <span className="text-sm">{traitLabels[trait]}</span>
                      </label>
                    ))}
                  </div>
                )}
              />
              {errors.persona?.traits && (
                <p className="text-sm text-destructive">
                  {errors.persona.traits.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Input
                id="language"
                placeholder="en-US"
                {...register('persona.language')}
                disabled={isLoading}
              />
            </div>
          </TabsContent>

          {/* Voice Tab */}
          <TabsContent value="voice" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="voiceId">Voice</Label>
              <div className="flex gap-2">
                <Controller
                  name="voice.voiceId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={handleVoiceSelect}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="voiceId" className="flex-1">
                        <SelectValue placeholder="Select voice" />
                      </SelectTrigger>
                      <SelectContent>
                        {voiceOptions.map((voice) => (
                          <SelectItem key={voice.id} value={voice.id}>
                            {voice.name}
                            {voice.gender && (
                              <span className="text-muted-foreground ml-2">
                                ({voice.gender})
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {onPreviewVoice && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => onPreviewVoice(selectedVoiceId)}
                    disabled={isLoading || !selectedVoiceId}
                    title="Preview voice"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="voiceName">Voice Display Name</Label>
              <Input
                id="voiceName"
                placeholder="Alloy"
                {...register('voice.voiceName')}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="voiceGender">Gender</Label>
              <Controller
                name="voice.gender"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || ''}
                    onValueChange={field.onChange}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="voiceGender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {voiceGenders.map((gender) => (
                        <SelectItem key={gender} value={gender}>
                          {gender.charAt(0).toUpperCase() + gender.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Speaking Rate: {watch('voice.speakingRate')?.toFixed(1) || '1.0'}x</Label>
              <Controller
                name="voice.speakingRate"
                control={control}
                render={({ field }) => (
                  <Slider
                    value={[field.value || 1.0]}
                    onValueChange={(values: number[]) => field.onChange(values[0])}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    disabled={isLoading}
                  />
                )}
              />
              <p className="text-xs text-muted-foreground">
                0.5x (slow) to 2.0x (fast)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Pitch: {watch('voice.pitch') || 0}</Label>
              <Controller
                name="voice.pitch"
                control={control}
                render={({ field }) => (
                  <Slider
                    value={[field.value || 0]}
                    onValueChange={(values: number[]) => field.onChange(values[0])}
                    min={-20}
                    max={20}
                    step={1}
                    disabled={isLoading}
                  />
                )}
              />
              <p className="text-xs text-muted-foreground">
                -20 (lower) to +20 (higher)
              </p>
            </div>
          </TabsContent>

          {/* Avatar Tab */}
          <TabsContent value="avatar" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="avatarType">Avatar Type</Label>
              <Controller
                name="avatar.type"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="avatarType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {avatarTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {avatarTypeLabels[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {avatarType === 'image' && (
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  placeholder="https://example.com/avatar.png"
                  {...register('avatar.imageUrl')}
                  className={cn(errors.avatar?.imageUrl && 'border-destructive')}
                  disabled={isLoading}
                />
                {errors.avatar?.imageUrl && (
                  <p className="text-sm text-destructive">
                    {errors.avatar.imageUrl.message}
                  </p>
                )}
              </div>
            )}

            {avatarType === 'initials' && (
              <div className="space-y-2">
                <Label htmlFor="initials">Initials</Label>
                <Input
                  id="initials"
                  placeholder="AI"
                  maxLength={3}
                  {...register('avatar.initials')}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Up to 3 characters
                </p>
              </div>
            )}

            {avatarType === 'icon' && (
              <div className="space-y-2">
                <Label htmlFor="iconName">Icon Name</Label>
                <Input
                  id="iconName"
                  placeholder="bot"
                  {...register('avatar.iconName')}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Uses role-based icon if not specified
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="avatar.backgroundColor"
                control={control}
                render={({ field }) => (
                  <ColorPicker
                    id="backgroundColor"
                    label="Background Color"
                    value={field.value || '#6366f1'}
                    onChange={field.onChange}
                    disabled={isLoading}
                  />
                )}
              />

              <Controller
                name="avatar.foregroundColor"
                control={control}
                render={({ field }) => (
                  <ColorPicker
                    id="foregroundColor"
                    label="Foreground Color"
                    value={field.value || '#ffffff'}
                    onChange={field.onChange}
                    disabled={isLoading}
                  />
                )}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" />}
            {mode === 'create' ? 'Create Actor' : 'Save Changes'}
          </Button>
        </div>
      </form>
    );
  }
);

AIActorForm.displayName = 'AIActorForm';
