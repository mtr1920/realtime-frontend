/**
 * AIActorListPanel Component
 *
 * Manages a list of AI actors within domain configuration.
 * Provides add, edit, and delete functionality.
 */

import { useState, forwardRef, useCallback } from 'react';
import { Bot, Plus, Pencil, Trash2, Sparkles } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Switch,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import {
  AIActorForm,
  roleLabels,
  type AIActorFormData,
} from '@/features/ai';
import type { AIConfig } from '../utils/config-serializer';

// =============================================================================
// Types
// =============================================================================

interface AIActorListPanelProps {
  /** Current AI configuration */
  value: AIConfig;
  /** Callback when configuration changes */
  onChange: (value: AIConfig) => void;
  /** Whether the panel is disabled */
  disabled?: boolean;
  /** Additional class name */
  className?: string;
}

// =============================================================================
// Actor Card Component
// =============================================================================

interface ActorCardProps {
  actor: AIActorFormData;
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

function ActorCard({ actor, onEdit, onDelete, disabled }: ActorCardProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: actor.avatar.backgroundColor || '#6366f1',
            color: actor.avatar.foregroundColor || '#ffffff',
          }}
        >
          {actor.avatar.type === 'initials' && actor.avatar.initials ? (
            <span className="text-sm font-medium">{actor.avatar.initials}</span>
          ) : (
            <Bot className="h-5 w-5" />
          )}
        </div>
        <div>
          <p className="font-medium">{actor.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="secondary" className="text-xs">
              {roleLabels[actor.role] || actor.role}
            </Badge>
            {actor.voice?.voiceName && (
              <span className="text-xs text-muted-foreground">
                Voice: {actor.voice.voiceName}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          disabled={disabled}
          aria-label={`Edit ${actor.name}`}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          disabled={disabled}
          aria-label={`Delete ${actor.name}`}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// Empty State Component
// =============================================================================

function EmptyState({ onAdd, disabled }: { onAdd: () => void; disabled?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="p-3 rounded-full bg-muted mb-3">
        <Bot className="h-8 w-8 text-muted-foreground" />
      </div>
      <h4 className="font-medium mb-1">No AI Actors</h4>
      <p className="text-sm text-muted-foreground mb-4 max-w-xs">
        Add AI actors to enable AI-powered interactions in sessions.
      </p>
      <Button onClick={onAdd} disabled={disabled}>
        <Plus className="h-4 w-4 mr-2" />
        Add AI Actor
      </Button>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export const AIActorListPanel = forwardRef<HTMLDivElement, AIActorListPanelProps>(
  ({ value, onChange, disabled = false, className }, ref) => {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingActor, setEditingActor] = useState<AIActorFormData | null>(null);
    const [deletingActorId, setDeletingActorId] = useState<string | null>(null);

    const handleToggleEnabled = useCallback(
      (enabled: boolean) => {
        onChange({ ...value, enabled });
      },
      [value, onChange]
    );

    const handleAddActor = useCallback(
      async (data: AIActorFormData) => {
        const newActor = {
          ...data,
          id: data.id || crypto.randomUUID(),
          isActive: true,
        };
        onChange({
          ...value,
          actors: [...value.actors, newActor],
        });
        setIsAddDialogOpen(false);
      },
      [value, onChange]
    );

    const handleEditActor = useCallback(
      async (data: AIActorFormData) => {
        onChange({
          ...value,
          actors: value.actors.map((actor) =>
            actor.id === editingActor?.id ? { ...data, id: actor.id } : actor
          ),
        });
        setEditingActor(null);
      },
      [value, onChange, editingActor]
    );

    const handleDeleteActor = useCallback(() => {
      if (!deletingActorId) return;
      onChange({
        ...value,
        actors: value.actors.filter((actor) => actor.id !== deletingActorId),
      });
      setDeletingActorId(null);
    }, [value, onChange, deletingActorId]);

    const deletingActor = value.actors.find((a) => a.id === deletingActorId);

    return (
      <>
        <Card ref={ref} className={cn('', className)}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-base">AI Actors</CardTitle>
                  <CardDescription>
                    Configure AI-powered participants for sessions.
                  </CardDescription>
                </div>
              </div>
              <Switch
                checked={value.enabled}
                onCheckedChange={handleToggleEnabled}
                disabled={disabled}
                aria-label="Enable AI"
              />
            </div>
          </CardHeader>

          {value.enabled && (
            <CardContent className="space-y-4">
              {value.actors.length === 0 ? (
                <EmptyState
                  onAdd={() => setIsAddDialogOpen(true)}
                  disabled={disabled}
                />
              ) : (
                <>
                  <div className="space-y-2">
                    {value.actors.map((actor) => (
                      <ActorCard
                        key={actor.id}
                        actor={actor}
                        onEdit={() => setEditingActor(actor)}
                        onDelete={() => setDeletingActorId(actor.id || '')}
                        disabled={disabled}
                      />
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddDialogOpen(true)}
                    disabled={disabled}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Actor
                  </Button>
                </>
              )}
            </CardContent>
          )}
        </Card>

        {/* Add Actor Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add AI Actor</DialogTitle>
              <DialogDescription>
                Create a new AI actor with personality, voice, and appearance settings.
              </DialogDescription>
            </DialogHeader>
            <AIActorForm
              mode="create"
              onSubmit={handleAddActor}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Actor Dialog */}
        <Dialog
          open={editingActor !== null}
          onOpenChange={(open) => !open && setEditingActor(null)}
        >
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit AI Actor</DialogTitle>
              <DialogDescription>
                Update the AI actor&apos;s personality, voice, and appearance settings.
              </DialogDescription>
            </DialogHeader>
            {editingActor && (
              <AIActorForm
                mode="edit"
                actor={{
                  id: editingActor.id || '',
                  name: editingActor.name,
                  role: editingActor.role,
                  persona: editingActor.persona,
                  voice: editingActor.voice,
                  avatar: editingActor.avatar,
                  isActive: editingActor.isActive ?? true,
                }}
                onSubmit={handleEditActor}
                onCancel={() => setEditingActor(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={deletingActorId !== null}
          onOpenChange={(open) => !open && setDeletingActorId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete AI Actor</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{deletingActor?.name}&quot;? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteActor}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }
);

AIActorListPanel.displayName = 'AIActorListPanel';
