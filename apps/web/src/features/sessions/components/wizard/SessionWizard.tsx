/* eslint-disable max-lines -- Refactor: TASK-REFACTOR-003 extract wizard steps into sub-components */
/**
 * SessionWizard Component
 *
 * Multi-step session creation wizard with:
 * - Step 1: Basics (Workspace, External ID)
 * - Step 2: Configuration (Duration, Schedule)
 * - Step 3: Review & Create
 */

import { useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  Copy,
  Check,
  Loader2,
  Video,
  Link2,
  ExternalLink,
  AlertCircle,
  Building2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Skeleton,
  Separator,
  Badge,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { useWorkspaces, type Workspace } from '@/features/workspaces';
import {
  useCreateSession,
  createSessionSchema,
  type CreateSessionFormData,
} from '@/features/sessions';
import { WizardStepper, type WizardStep } from './WizardStepper';

// =============================================================================
// Types
// =============================================================================

interface SessionCreatedData {
  id: string;
  accessToken: string;
  workspaceName: string;
  expiresAt: string;
}

// =============================================================================
// Constants
// =============================================================================

const WIZARD_STEPS: WizardStep[] = [
  { id: 'basics', title: 'Basics', description: 'Workspace & ID' },
  { id: 'config', title: 'Configure', description: 'Duration & Schedule' },
  { id: 'review', title: 'Review', description: 'Confirm & Create' },
];

const DURATION_OPTIONS = [
  { value: 15, label: '15 minutes', description: 'Quick session' },
  { value: 30, label: '30 minutes', description: 'Short meeting' },
  { value: 60, label: '1 hour', description: 'Standard session' },
  { value: 120, label: '2 hours', description: 'Extended session' },
  { value: 240, label: '4 hours', description: 'Half day' },
  { value: 480, label: '8 hours', description: 'Full day' },
];

// =============================================================================
// Component
// =============================================================================

export function SessionWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [createdSession, setCreatedSession] =
    useState<SessionCreatedData | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Fetch workspaces for selection
  const { workspaces, isLoading: isLoadingWorkspaces } = useWorkspaces();

  const { createSession, isLoading: isCreating } = useCreateSession({
    onSuccess: (data) => {
      const workspace = workspaces.find((w) => w.id === data.workspaceId);
      setCreatedSession({
        id: data.id,
        accessToken: data.accessToken || '',
        workspaceName: workspace?.name || 'Unknown',
        expiresAt: data.expiresAt,
      });
      toast.success('Session created successfully');
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<CreateSessionFormData>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      workspaceId: '',
      externalId: '',
      expiresInMinutes: 60,
      scheduledAt: '',
    },
  });

  const formValues = watch();
  const selectedWorkspace = workspaces.find(
    (w) => w.id === formValues.workspaceId
  );

  // Navigation handlers
  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < WIZARD_STEPS.length) {
      setCurrentStep(step);
    }
  }, []);

  const goNext = useCallback(async () => {
    // Validate current step before proceeding
    if (currentStep === 0) {
      const isValid = await trigger(['workspaceId']);
      if (!isValid) return;
    }

    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, trigger]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleCopyToken = useCallback(async () => {
    if (!createdSession?.accessToken) return;
    await navigator.clipboard.writeText(createdSession.accessToken);
    setCopiedToken(true);
    toast.success('Access token copied to clipboard');
    setTimeout(() => setCopiedToken(false), 2000);
  }, [createdSession]);

  const onSubmit = async (data: CreateSessionFormData) => {
    await createSession({
      workspaceId: data.workspaceId,
      externalId: data.externalId || undefined,
      expiresInMinutes: data.expiresInMinutes,
      scheduledAt: data.scheduledAt || undefined,
    });
  };

  const formatDateTime = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }, []);

  // Success state
  if (createdSession) {
    return (
      <SuccessState
        session={createdSession}
        onCopyToken={handleCopyToken}
        copiedToken={copiedToken}
        formatDateTime={formatDateTime}
        onViewSession={() => navigate({ to: `/sessions/${createdSession.id}` })}
        onCreateAnother={() => {
          setCreatedSession(null);
          setCopiedToken(false);
          setCurrentStep(0);
        }}
        onBackToSessions={() => navigate({ to: '/sessions' })}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate({ to: '/sessions' })}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Sessions
      </Button>

      {/* Stepper */}
      <WizardStepper
        steps={WIZARD_STEPS}
        currentStep={currentStep}
        onStepClick={goToStep}
      />

      {/* Step Content */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="glass-card overflow-hidden">
          <div className="relative">
            {/* Step 1: Basics */}
            <StepContent isActive={currentStep === 0}>
              <StepBasics
                workspaces={workspaces}
                isLoadingWorkspaces={isLoadingWorkspaces}
                selectedWorkspaceId={formValues.workspaceId}
                externalId={formValues.externalId || ''}
                errors={errors}
                setValue={setValue}
                register={register}
              />
            </StepContent>

            {/* Step 2: Configuration */}
            <StepContent isActive={currentStep === 1}>
              <StepConfiguration
                expiresInMinutes={formValues.expiresInMinutes ?? 60}
                scheduledAt={formValues.scheduledAt || ''}
                setValue={setValue}
                register={register}
              />
            </StepContent>

            {/* Step 3: Review */}
            <StepContent isActive={currentStep === 2}>
              <StepReview
                workspace={selectedWorkspace}
                formValues={formValues}
                isCreating={isCreating}
              />
            </StepContent>
          </div>

          {/* Navigation Footer */}
          <div className="bg-muted/30 border-t p-4">
            <div className="flex justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={goBack}
                disabled={currentStep === 0 || isCreating}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              {currentStep < WIZARD_STEPS.length - 1 ? (
                <Button type="button" onClick={goNext}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isCreating || isLoadingWorkspaces}
                  className="from-primary to-primary/80 press-effect bg-gradient-to-r"
                >
                  {isCreating && (
                    <Loader2 className="mr-2 h-4 w-4 motion-safe:animate-spin" />
                  )}
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create Session
                </Button>
              )}
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}

// =============================================================================
// Step Content Wrapper
// =============================================================================

interface StepContentProps {
  isActive: boolean;
  children: React.ReactNode;
}

function StepContent({ isActive, children }: StepContentProps) {
  return (
    <div
      className={cn(
        'transition-all duration-300',
        isActive
          ? 'translate-x-0 opacity-100'
          : 'pointer-events-none absolute inset-0 translate-x-8 opacity-0'
      )}
      aria-hidden={!isActive}
    >
      {children}
    </div>
  );
}

// =============================================================================
// Step 1: Basics
// =============================================================================

interface StepBasicsProps {
  workspaces: Workspace[];
  isLoadingWorkspaces: boolean;
  selectedWorkspaceId: string;
  externalId: string;
  errors: Record<string, { message?: string }>;
  setValue: (name: keyof CreateSessionFormData, value: string | number) => void;
  register: ReturnType<typeof useForm<CreateSessionFormData>>['register'];
}

function StepBasics({
  workspaces,
  isLoadingWorkspaces,
  selectedWorkspaceId,
  errors,
  setValue,
  register,
}: StepBasicsProps) {
  return (
    <>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
            <Building2 className="text-primary h-6 w-6" />
          </div>
          <div>
            <CardTitle>Select Workspace</CardTitle>
            <CardDescription>
              Choose where this session will be created
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Workspace Selection */}
        <div className="space-y-3">
          <Label htmlFor="workspaceId">
            Workspace <span className="text-destructive">*</span>
          </Label>
          {isLoadingWorkspaces ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  type="button"
                  onClick={() => setValue('workspaceId', workspace.id)}
                  className={cn(
                    'relative flex flex-col items-start rounded-xl border-2 p-4 text-left',
                    'press-effect transition-all duration-200',
                    'hover:border-primary/50 hover:bg-muted/50',
                    selectedWorkspaceId === workspace.id
                      ? 'border-primary bg-primary/5 ring-primary/20 ring-2'
                      : 'border-muted'
                  )}
                >
                  <div className="mb-1 flex w-full items-center justify-between">
                    <span className="font-medium">{workspace.name}</span>
                    {selectedWorkspaceId === workspace.id && (
                      <Check className="text-primary motion-safe:animate-check-bounce h-4 w-4" />
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {workspace.domainType}
                  </Badge>
                </button>
              ))}
            </div>
          )}
          {errors.workspaceId && (
            <p className="text-destructive flex items-center gap-1 text-sm">
              <AlertCircle className="h-3 w-3" />
              {errors.workspaceId.message}
            </p>
          )}
        </div>

        <Separator />

        {/* External ID */}
        <div className="space-y-2">
          <Label htmlFor="externalId">
            External ID
            <span className="text-muted-foreground ml-1 text-xs">
              (Optional)
            </span>
          </Label>
          <div className="relative">
            <ExternalLink className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              id="externalId"
              placeholder="e.g., MEETING-123, interview-abc"
              className="pl-10"
              {...register('externalId')}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            Link this session to your external systems
          </p>
        </div>
      </CardContent>
    </>
  );
}

// =============================================================================
// Step 2: Configuration
// =============================================================================

interface StepConfigurationProps {
  expiresInMinutes: number;
  scheduledAt: string;
  setValue: (name: keyof CreateSessionFormData, value: string | number) => void;
  register: ReturnType<typeof useForm<CreateSessionFormData>>['register'];
}

function StepConfiguration({
  expiresInMinutes,
  setValue,
  register,
}: StepConfigurationProps) {
  return (
    <>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
            <Clock className="text-primary h-6 w-6" />
          </div>
          <div>
            <CardTitle>Configure Session</CardTitle>
            <CardDescription>
              Set duration and scheduling options
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Duration Selection */}
        <div className="space-y-3">
          <Label>Session Duration</Label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {DURATION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setValue('expiresInMinutes', option.value)}
                className={cn(
                  'flex flex-col items-center rounded-xl border-2 p-4 text-center',
                  'press-effect transition-all duration-200',
                  'hover:border-primary/50 hover:bg-muted/50',
                  expiresInMinutes === option.value
                    ? 'border-primary bg-primary/5 ring-primary/20 ring-2'
                    : 'border-muted'
                )}
              >
                <span className="font-semibold">{option.label}</span>
                <span className="text-muted-foreground mt-0.5 text-xs">
                  {option.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Schedule Date/Time */}
        <div className="space-y-2">
          <Label htmlFor="scheduledAt">
            Schedule For
            <span className="text-muted-foreground ml-1 text-xs">
              (Optional)
            </span>
          </Label>
          <div className="relative">
            <Calendar className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              id="scheduledAt"
              type="datetime-local"
              className="pl-10"
              {...register('scheduledAt')}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            Leave empty to create a session that starts immediately
          </p>
        </div>
      </CardContent>
    </>
  );
}

// =============================================================================
// Step 3: Review
// =============================================================================

interface StepReviewProps {
  workspace: Workspace | undefined;
  formValues: CreateSessionFormData;
  isCreating: boolean;
}

function StepReview({ workspace, formValues, isCreating }: StepReviewProps) {
  const duration = DURATION_OPTIONS.find(
    (d) => d.value === formValues.expiresInMinutes
  );

  return (
    <>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
            <Video className="text-primary h-6 w-6" />
          </div>
          <div>
            <CardTitle>Review & Create</CardTitle>
            <CardDescription>Confirm your session details</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/50 space-y-4 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Workspace</span>
            <span className="text-sm font-medium">
              {workspace?.name || 'Not selected'}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Domain Type</span>
            <Badge variant="outline">{workspace?.domainType || '-'}</Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">External ID</span>
            <span className="font-mono text-sm">
              {formValues.externalId || (
                <span className="text-muted-foreground">None</span>
              )}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Duration</span>
            <span className="text-sm font-medium">
              {duration?.label || '-'}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Scheduled</span>
            <span className="text-sm">
              {formValues.scheduledAt
                ? new Date(formValues.scheduledAt).toLocaleString()
                : 'Immediately'}
            </span>
          </div>
        </div>

        {isCreating && (
          <div className="text-muted-foreground mt-4 flex items-center justify-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 motion-safe:animate-spin" />
            Creating your session...
          </div>
        )}
      </CardContent>
    </>
  );
}

// =============================================================================
// Success State
// =============================================================================

interface SuccessStateProps {
  session: SessionCreatedData;
  onCopyToken: () => void;
  copiedToken: boolean;
  formatDateTime: (date: string) => string;
  onViewSession: () => void;
  onCreateAnother: () => void;
  onBackToSessions: () => void;
}

function SuccessState({
  session,
  onCopyToken,
  copiedToken,
  formatDateTime,
  onViewSession,
  onCreateAnother,
  onBackToSessions,
}: SuccessStateProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" onClick={onBackToSessions} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Sessions
      </Button>

      <Card className="glass-card overflow-hidden border-green-500/30">
        {/* Success Animation Header */}
        <div className="relative bg-gradient-to-br from-green-500/10 to-emerald-500/10 py-8">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'flex h-20 w-20 items-center justify-center rounded-full',
                'bg-green-500 text-white',
                'motion-safe:animate-check-bounce'
              )}
            >
              <Check className="h-10 w-10" />
            </div>
            <h2 className="mt-4 text-2xl font-bold">Session Created!</h2>
            <p className="text-muted-foreground mt-1">
              Share the access token with participants
            </p>
          </div>

          {/* Confetti-like decoration */}
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden"
            aria-hidden
          >
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  'absolute h-2 w-2 rounded-full',
                  i % 3 === 0 && 'bg-green-400',
                  i % 3 === 1 && 'bg-emerald-400',
                  i % 3 === 2 && 'bg-teal-400',
                  'motion-safe:animate-float'
                )}
                style={{
                  left: `${15 + i * 15}%`,
                  top: `${20 + (i % 2) * 60}%`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>

        <CardContent className="space-y-6 pt-6">
          {/* Session Details */}
          <div className="bg-muted/50 space-y-3 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Workspace</span>
              <span className="text-sm font-medium">
                {session.workspaceName}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Session ID</span>
              <code className="bg-muted rounded px-2 py-1 font-mono text-xs">
                {session.id.slice(0, 8)}...
              </code>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Expires</span>
              <span className="text-sm">
                {formatDateTime(session.expiresAt)}
              </span>
            </div>
          </div>

          {/* Access Token */}
          {session.accessToken && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Access Token
              </Label>
              <div className="flex gap-2">
                <Input
                  value={session.accessToken}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onCopyToken}
                  aria-label="Copy access token"
                  className="press-effect"
                >
                  {copiedToken ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
                <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                Share this token securely. It&apos;s only shown once.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4 sm:flex-row">
            <Button className="press-effect flex-1" onClick={onViewSession}>
              <Video className="mr-2 h-4 w-4" />
              View Session
            </Button>
            <Button
              variant="outline"
              className="press-effect flex-1"
              onClick={onCreateAnother}
            >
              Create Another
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
