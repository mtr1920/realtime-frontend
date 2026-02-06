/**
 * Outcomes Feature
 * Public exports for the outcome management module.
 */

// Types
export {
  outcomeStatusLabels,
  artifactTypeLabels,
  integrityStatusLabels,
  type Outcome,
  type OutcomeStatus,
  type OutcomeSummary,
  type OutcomeEvaluation,
  type OutcomeDecision,
  type OutcomeIntegrity,
  type OutcomeArtifact,
  type ArtifactType,
  type IntegrityStatus,
  type CriteriaScore,
  type OutcomeListParams,
  type PaginatedOutcomesResponse,
  type RejectOutcomeInput,
} from './types/outcomes.types';

// Schemas
export {
  outcomeStatusSchema,
  artifactTypeSchema,
  outcomeFiltersSchema,
  rejectOutcomeSchema,
  type OutcomeStatusEnum,
  type ArtifactTypeEnum,
  type OutcomeFiltersFormData,
  type RejectOutcomeFormData,
} from './schemas/outcomes.schema';

// API Service
export { outcomesService } from './api/outcomes.service';

// Hooks
export { useOutcomes } from './hooks/useOutcomes';
export { useOutcome } from './hooks/useOutcome';
export { useSessionOutcome } from './hooks/useSessionOutcome';
export { useApproveOutcome } from './hooks/useApproveOutcome';
export { useRejectOutcome } from './hooks/useRejectOutcome';
export { useRegenerateOutcome } from './hooks/useRegenerateOutcome';
export { useOutcomeArtifacts } from './hooks/useOutcomeArtifacts';
export { useDownloadArtifact } from './hooks/useDownloadArtifact';

// Components
export { OutcomeStatusBadge } from './components/OutcomeStatusBadge';
export { OutcomeCard } from './components/OutcomeCard';
export { OutcomeList } from './components/OutcomeList';
export { OutcomeSummary as OutcomeSummaryPanel } from './components/OutcomeSummary';
export { OutcomeEvaluation as OutcomeEvaluationPanel } from './components/OutcomeEvaluation';
export { OutcomeDecision as OutcomeDecisionPanel } from './components/OutcomeDecision';
export { OutcomeIntegrity as OutcomeIntegrityPanel } from './components/OutcomeIntegrity';
export { OutcomeArtifactsPanel } from './components/OutcomeArtifactsPanel';
export { OutcomeDetailDialog } from './components/OutcomeDetailDialog';
export { RejectOutcomeDialog } from './components/RejectOutcomeDialog';
