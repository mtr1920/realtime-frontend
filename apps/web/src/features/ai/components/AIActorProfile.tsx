/**
 * AIActorProfile Component
 *
 * Displays AI actor profile:
 * - Avatar
 * - Name and role
 * - Active indicator
 * - Selection support (when multiple actors available)
 *
 * Uses configuration-driven role labels from session config where available.
 */

import { forwardRef, memo } from 'react';
import { Bot, User, Headphones, GraduationCap, Briefcase, Shield } from 'lucide-react';
import { useRoleConfig } from '@/features/sessions';
import { Button, Avatar, AvatarFallback, AvatarImage, Badge } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import type { AIActor, AIActorRole } from '../types/actor.types';

// =============================================================================
// Types
// =============================================================================

interface AIActorProfileProps {
  /** Actor profile */
  actor: AIActor;
  /** Whether this actor is currently active */
  isActive?: boolean;
  /** Whether this actor is selectable */
  isSelectable?: boolean;
  /** Callback when actor is selected */
  onSelect?: (actorId: string) => void;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Additional class name */
  className?: string;
}

interface AIActorAvatarProps {
  actor: AIActor;
  size: 'sm' | 'md' | 'lg';
  isActive?: boolean;
}

// =============================================================================
// Helpers
// =============================================================================

function getRoleIcon(role: AIActorRole) {
  switch (role) {
    case 'interviewer':
      return User;
    case 'assistant':
      return Bot;
    case 'coach':
      return Headphones;
    case 'trainer':
      return GraduationCap;
    case 'sales_expert':
      return Briefcase;
    case 'moderator':
      return Shield;
    default:
      return Bot;
  }
}

function getSizeConfig(size: 'sm' | 'md' | 'lg') {
  switch (size) {
    case 'sm':
      return {
        avatar: 'h-8 w-8',
        icon: 'h-4 w-4',
        nameSize: 'text-sm',
        roleSize: 'text-xs',
        badgeSize: 'text-[10px] px-1.5 py-0',
      };
    case 'md':
      return {
        avatar: 'h-12 w-12',
        icon: 'h-6 w-6',
        nameSize: 'text-base',
        roleSize: 'text-sm',
        badgeSize: 'text-xs',
      };
    case 'lg':
      return {
        avatar: 'h-16 w-16',
        icon: 'h-8 w-8',
        nameSize: 'text-lg',
        roleSize: 'text-base',
        badgeSize: 'text-sm',
      };
  }
}

// =============================================================================
// Actor Avatar
// =============================================================================

const ActorAvatar = memo(function ActorAvatar({
  actor,
  size,
  isActive,
}: AIActorAvatarProps) {
  const sizeConfig = getSizeConfig(size);
  const { avatar } = actor;
  const RoleIcon = getRoleIcon(actor.role);

  return (
    <div className="relative">
      <Avatar
        className={cn(
          sizeConfig.avatar,
          'border-2',
          isActive ? 'border-primary' : 'border-transparent'
        )}
        style={{
          backgroundColor: avatar.backgroundColor,
          color: avatar.foregroundColor,
        }}
      >
        {avatar.type === 'image' && avatar.imageUrl && (
          <AvatarImage src={avatar.imageUrl} alt={actor.name} />
        )}
        <AvatarFallback
          style={{
            backgroundColor: avatar.backgroundColor ?? 'hsl(var(--primary))',
            color: avatar.foregroundColor ?? 'hsl(var(--primary-foreground))',
          }}
        >
          {avatar.type === 'initials' && avatar.initials ? (
            avatar.initials
          ) : avatar.type === 'icon' ? (
            <RoleIcon className={sizeConfig.icon} />
          ) : (
            <Bot className={sizeConfig.icon} />
          )}
        </AvatarFallback>
      </Avatar>

      {/* Active indicator dot */}
      {isActive && (
        <div
          className={cn(
            'absolute bottom-0 right-0 rounded-full bg-green-500 border-2 border-background',
            size === 'sm' ? 'h-2.5 w-2.5' : size === 'md' ? 'h-3 w-3' : 'h-4 w-4'
          )}
        />
      )}
    </div>
  );
});

// =============================================================================
// Component
// =============================================================================

export const AIActorProfile = forwardRef<HTMLDivElement, AIActorProfileProps>(
  (
    {
      actor,
      isActive = false,
      isSelectable = false,
      onSelect,
      size = 'md',
      orientation = 'horizontal',
      className,
    },
    ref
  ) => {
    const sizeConfig = getSizeConfig(size);
    const { getRoleLabel } = useRoleConfig();

    const content = (
      <>
        {/* Avatar */}
        <ActorAvatar actor={actor} size={size} isActive={isActive} />

        {/* Info */}
        <div
          className={cn(
            'min-w-0',
            orientation === 'vertical' && 'text-center'
          )}
        >
          <div className={cn('font-medium truncate', sizeConfig.nameSize)}>
            {actor.name}
          </div>
          <div
            className={cn(
              'text-muted-foreground truncate',
              sizeConfig.roleSize
            )}
          >
            {getRoleLabel(actor.role)}
          </div>
        </div>

        {/* Active Badge */}
        {isActive && (
          <Badge
            variant="default"
            className={cn('flex-shrink-0', sizeConfig.badgeSize)}
          >
            Active
          </Badge>
        )}
      </>
    );

    // Selectable button wrapper
    if (isSelectable && onSelect) {
      return (
        <Button
          ref={ref as React.Ref<HTMLButtonElement>}
          variant="ghost"
          className={cn(
            'h-auto p-2',
            orientation === 'horizontal'
              ? 'flex items-center gap-3 justify-start'
              : 'flex flex-col items-center gap-2',
            isActive && 'bg-primary/5',
            className
          )}
          onClick={() => onSelect(actor.id)}
        >
          {content}
        </Button>
      );
    }

    // Static display
    return (
      <div
        ref={ref}
        className={cn(
          orientation === 'horizontal'
            ? 'flex items-center gap-3'
            : 'flex flex-col items-center gap-2',
          className
        )}
      >
        {content}
      </div>
    );
  }
);

AIActorProfile.displayName = 'AIActorProfile';

// =============================================================================
// Actor Selector (for choosing between multiple actors)
// =============================================================================

interface AIActorSelectorProps {
  /** Available actors */
  actors: AIActor[];
  /** Currently selected actor ID */
  selectedActorId?: string;
  /** Callback when actor is selected */
  onSelect: (actorId: string) => void;
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Additional class name */
  className?: string;
}

export function AIActorSelector({
  actors,
  selectedActorId,
  onSelect,
  orientation = 'vertical',
  className,
}: AIActorSelectorProps) {
  if (actors.length === 0) {
    return null;
  }

  // If only one actor, show it without selection UI
  if (actors.length === 1) {
    return (
      <AIActorProfile
        actor={actors[0]!}
        isActive
        size="md"
        className={className}
      />
    );
  }

  return (
    <div
      className={cn(
        orientation === 'horizontal'
          ? 'flex items-center gap-2'
          : 'flex flex-col gap-1',
        className
      )}
      role="radiogroup"
      aria-label="Select AI actor"
    >
      {actors.map((actor) => (
        <AIActorProfile
          key={actor.id}
          actor={actor}
          isActive={actor.id === selectedActorId}
          isSelectable
          onSelect={onSelect}
          size="sm"
          orientation="horizontal"
        />
      ))}
    </div>
  );
}

// =============================================================================
// Compact Actor Display (for header/toolbar)
// =============================================================================

interface CompactActorDisplayProps {
  actor: AIActor;
  isActive?: boolean;
  className?: string;
}

export function CompactActorDisplay({
  actor,
  isActive,
  className,
}: CompactActorDisplayProps) {
  const RoleIcon = getRoleIcon(actor.role);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'h-6 w-6 rounded-full flex items-center justify-center',
          'bg-primary/10 text-primary'
        )}
      >
        <RoleIcon className="h-3.5 w-3.5" />
      </div>
      <span className="text-sm font-medium">{actor.name}</span>
      {isActive && (
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
      )}
    </div>
  );
}
