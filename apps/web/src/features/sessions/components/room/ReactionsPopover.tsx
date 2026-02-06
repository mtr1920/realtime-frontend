/**
 * ReactionsPopover
 *
 * Quick emoji reactions for session participants.
 * Provides common reactions like thumbs up, clap, raise hand, etc.
 */

import { useState } from 'react';
import { SmilePlus } from 'lucide-react';
import { Button } from '@/shared/ui';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

// =============================================================================
// Types
// =============================================================================

export type ReactionType = 'thumbsUp' | 'clap' | 'hand' | 'heart' | 'smile' | 'celebrate';

interface ReactionConfig {
  emoji: string;
  label: string;
  shortcut?: string;
}

interface ReactionsPopoverProps {
  /** Called when a reaction is selected */
  onReaction?: (reaction: ReactionType) => void;
  /** Currently active reaction (e.g., raised hand) */
  activeReaction?: ReactionType | null;
  /** Size of the trigger button */
  size?: 'sm' | 'default';
  /** Additional class name */
  className?: string;
}

// =============================================================================
// Constants
// =============================================================================

const REACTIONS: Record<ReactionType, ReactionConfig> = {
  thumbsUp: { emoji: '👍', label: 'Thumbs up' },
  clap: { emoji: '👏', label: 'Clap' },
  hand: { emoji: '✋', label: 'Raise hand', shortcut: 'H' },
  heart: { emoji: '❤️', label: 'Heart' },
  smile: { emoji: '😊', label: 'Smile' },
  celebrate: { emoji: '🎉', label: 'Celebrate' },
};

// =============================================================================
// Component
// =============================================================================

export function ReactionsPopover({
  onReaction,
  activeReaction,
  size = 'default',
  className,
}: ReactionsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleReaction = (reaction: ReactionType) => {
    onReaction?.(reaction);
    // Keep popover open for hand raise toggle, close for other reactions
    if (reaction !== 'hand') {
      setIsOpen(false);
    }
  };

  const isHandRaised = activeReaction === 'hand';

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant={isHandRaised ? 'secondary' : 'outline'}
              size={size === 'sm' ? 'sm' : 'icon'}
              className={cn(
                size === 'sm' ? 'h-8 w-8' : 'h-10 w-10',
                'press-effect',
                isHandRaised && 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-900 dark:hover:bg-amber-800',
                className
              )}
              aria-label="Open reactions"
            >
              {isHandRaised ? (
                <span className="text-lg" aria-hidden>✋</span>
              ) : (
                <SmilePlus className={cn(size === 'sm' ? 'h-4 w-4' : 'h-5 w-5')} />
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>
          {isHandRaised ? 'Lower hand' : 'Reactions'}
        </TooltipContent>
      </Tooltip>

      <PopoverContent
        side="top"
        align="center"
        className="w-auto p-2"
        sideOffset={8}
      >
        <div className="flex items-center gap-1">
          {(Object.entries(REACTIONS) as [ReactionType, ReactionConfig][]).map(
            ([type, config]) => {
              const isActive = activeReaction === type;

              return (
                <Tooltip key={type}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleReaction(type)}
                      className={cn(
                        'p-2 rounded-lg transition-all duration-150',
                        'hover:bg-muted hover:scale-110',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        'press-effect',
                        isActive && 'bg-primary/10 ring-2 ring-primary'
                      )}
                      aria-label={config.label}
                      aria-pressed={isActive}
                    >
                      <span className="text-xl" aria-hidden>
                        {config.emoji}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {config.label}
                    {config.shortcut && (
                      <span className="ml-2 text-muted-foreground">
                        ({config.shortcut})
                      </span>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            }
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
