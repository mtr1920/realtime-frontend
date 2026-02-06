/**
 * Create Workspace Dialog
 *
 * Enhanced modal form for creating a new workspace with visual
 * domain type selection, animated slug preview, and success celebration.
 */

import { useState, useEffect, memo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Loader2,
  Users,
  Briefcase,
  UserCheck,
  GraduationCap,
  Headphones,
  MessageSquare,
  Settings,
  Check,
  Sparkles,
} from 'lucide-react';
import {
  createWorkspaceSchema,
  type CreateWorkspaceFormData,
  type DomainType,
} from '../schemas/workspace.schema';
import { useCreateWorkspace } from '../hooks/useCreateWorkspace';
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
  Textarea,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface DomainTypeOption {
  value: DomainType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// =============================================================================
// Constants
// =============================================================================

const domainTypes: DomainTypeOption[] = [
  {
    value: 'interview',
    label: 'Interview',
    description: 'Conduct interviews with AI assistance',
    icon: Users,
    color: 'from-blue-500 to-cyan-400',
  },
  {
    value: 'presales',
    label: 'Pre-Sales',
    description: 'Demo and discovery sessions',
    icon: Briefcase,
    color: 'from-violet-500 to-purple-400',
  },
  {
    value: 'hr',
    label: 'People Management',
    description: 'HR conversations and reviews',
    icon: UserCheck,
    color: 'from-emerald-500 to-green-400',
  },
  {
    value: 'training',
    label: 'Training',
    description: 'Learning and development',
    icon: GraduationCap,
    color: 'from-amber-500 to-yellow-400',
  },
  {
    value: 'support',
    label: 'Support',
    description: 'Customer support sessions',
    icon: Headphones,
    color: 'from-rose-500 to-pink-400',
  },
  {
    value: 'consultation',
    label: 'Consultation',
    description: 'Expert consultations',
    icon: MessageSquare,
    color: 'from-indigo-500 to-blue-400',
  },
  {
    value: 'custom',
    label: 'Custom',
    description: 'Configure your own workflow',
    icon: Settings,
    color: 'from-slate-500 to-gray-400',
  },
];

// =============================================================================
// Sub-components
// =============================================================================

/**
 * Visual card for domain type selection
 */
const DomainTypeCard = memo(function DomainTypeCard({
  option,
  isSelected,
  onSelect,
}: {
  option: DomainTypeOption;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const Icon = option.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200',
        'hover:border-primary/50 hover:shadow-lg hover:-translate-y-1',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isSelected
          ? 'border-primary bg-primary/5 shadow-lg ring-1 ring-primary/20'
          : 'border-border/60 bg-card hover:bg-accent/30'
      )}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-md motion-safe:animate-scale-up">
          <Check className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
      )}

      {/* Icon with gradient background */}
      <div
        className={cn(
          'h-12 w-12 rounded-xl flex items-center justify-center mb-3 shadow-sm',
          'bg-gradient-to-br transition-transform duration-200',
          'group-hover:scale-110',
          option.color
        )}
      >
        <Icon className="h-6 w-6 text-white" />
      </div>

      {/* Label */}
      <span
        className={cn(
          'text-sm font-semibold transition-colors text-center',
          isSelected ? 'text-primary' : 'text-foreground'
        )}
      >
        {option.label}
      </span>

      {/* Description */}
      <span className="text-xs text-muted-foreground text-center mt-1 line-clamp-2 leading-relaxed">
        {option.description}
      </span>
    </button>
  );
});

/**
 * Animated URL slug preview
 */
const SlugPreview = memo(function SlugPreview({ slug }: { slug: string }) {
  const [displayedSlug, setDisplayedSlug] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!slug) {
      setDisplayedSlug('');
      return;
    }

    setIsTyping(true);
    let index = 0;
    const interval = setInterval(() => {
      if (index <= slug.length) {
        setDisplayedSlug(slug.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [slug]);

  if (!slug) return null;

  return (
    <div className="p-3 bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg border border-border/50">
      <p className="text-xs text-muted-foreground mb-1.5 font-medium">Your workspace URL</p>
      <p className="text-sm font-mono bg-background/50 px-3 py-2 rounded-md border border-border/30">
        <span className="text-muted-foreground">app.example.com/</span>
        <span className="text-primary font-semibold">{displayedSlug}</span>
        {isTyping && (
          <span className="inline-block w-0.5 h-4 bg-primary motion-safe:animate-pulse ml-0.5 align-middle" />
        )}
      </p>
    </div>
  );
});

/**
 * Success celebration overlay
 */
const SuccessCelebration = memo(function SuccessCelebration({
  workspaceName,
  onContinue,
}: {
  workspaceName: string;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 motion-safe:animate-scale-up">
      {/* Success icon with glow */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl motion-safe:animate-pulse" />
        <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center">
          <Check className="h-8 w-8 text-white motion-safe:animate-check-bounce" />
        </div>
      </div>

      {/* Sparkles decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <Sparkles
            key={i}
            className={cn(
              'absolute h-4 w-4 text-yellow-400 motion-safe:animate-float',
              i === 0 && 'top-4 left-8',
              i === 1 && 'top-8 right-12',
              i === 2 && 'bottom-16 left-12',
              i === 3 && 'bottom-12 right-8',
              i === 4 && 'top-16 left-1/4',
              i === 5 && 'bottom-24 right-1/4'
            )}
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>

      {/* Message */}
      <h3 className="text-xl font-semibold text-foreground mb-2">
        Workspace Created!
      </h3>
      <p className="text-muted-foreground text-center mb-6">
        <span className="font-medium text-foreground">{workspaceName}</span> is
        ready to use.
      </p>

      {/* Action button */}
      <Button
        onClick={onContinue}
        className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
      >
        Get Started
      </Button>
    </div>
  );
});

// =============================================================================
// Main Component
// =============================================================================

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateWorkspaceDialogProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdWorkspaceName, setCreatedWorkspaceName] = useState('');

  const { createWorkspace, isLoading } = useCreateWorkspace({
    onSuccess: () => {
      setShowSuccess(true);
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateWorkspaceFormData>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
    },
  });

  const selectedDomainType = watch('domainType');
  const watchedSlug = watch('slug');
  const watchedName = watch('name');

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setValue('slug', slug);
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after animation completes
    setTimeout(() => {
      reset();
      setShowSuccess(false);
      setCreatedWorkspaceName('');
    }, 200);
  };

  const handleSuccessContinue = () => {
    handleClose();
    onSuccess?.();
  };

  const onSubmit = async (data: CreateWorkspaceFormData) => {
    setCreatedWorkspaceName(data.name);
    await createWorkspace({
      name: data.name,
      slug: data.slug || undefined,
      description: data.description || undefined,
      domainType: data.domainType,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[720px]">
        {showSuccess ? (
          <SuccessCelebration
            workspaceName={createdWorkspaceName}
            onContinue={handleSuccessContinue}
          />
        ) : (
          <>
            <DialogHeader className="pb-2">
              <DialogTitle className="text-xl">Create Workspace</DialogTitle>
              <DialogDescription className="text-base">
                Create a new workspace to organize your sessions and team
                members.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Domain Type Selection as Visual Cards */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Select Domain Type</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {domainTypes.map((option) => (
                    <DomainTypeCard
                      key={option.value}
                      option={option}
                      isSelected={selectedDomainType === option.value}
                      onSelect={() => setValue('domainType', option.value)}
                    />
                  ))}
                </div>
                {errors.domainType && (
                  <p className="text-sm text-destructive">
                    {errors.domainType.message}
                  </p>
                )}
              </div>

              {/* Name and Slug in two columns on larger screens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name Input */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Workspace Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="My Workspace"
                    {...register('name', {
                      onChange: handleNameChange,
                    })}
                    className={cn(
                      'h-11 transition-all',
                      errors.name && 'border-destructive focus-visible:ring-destructive',
                      watchedName && !errors.name && 'border-primary/50'
                    )}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* URL Slug */}
                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-sm font-medium">
                    URL Slug
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground font-medium">/</span>
                    <Input
                      id="slug"
                      placeholder="my-workspace"
                      {...register('slug')}
                      className={cn(
                        'h-11 font-mono',
                        errors.slug && 'border-destructive focus-visible:ring-destructive'
                      )}
                    />
                  </div>
                  {errors.slug && (
                    <p className="text-sm text-destructive">
                      {errors.slug.message}
                    </p>
                  )}
                </div>
              </div>

              {/* URL Preview */}
              <SlugPreview slug={watchedSlug || ''} />

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description{' '}
                  <span className="text-muted-foreground font-normal text-xs">
                    (Optional)
                  </span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="A brief description of this workspace..."
                  rows={3}
                  {...register('description')}
                  className="resize-none min-h-[80px]"
                />
              </div>

              <DialogFooter className="gap-3 pt-4 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="min-w-[100px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    'min-w-[160px] h-11 transition-all font-medium',
                    !isLoading &&
                      'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg'
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Workspace'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
