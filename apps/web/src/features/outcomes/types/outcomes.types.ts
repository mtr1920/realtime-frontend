/**
 * Outcomes Types
 * Type definitions for outcome management.
 */

/**
 * Outcome status.
 */
export type OutcomeStatus =
  | 'pending'
  | 'generating'
  | 'ready'
  | 'approved'
  | 'rejected'
  | 'failed';

/**
 * Artifact type.
 */
export type ArtifactType =
  | 'transcript'
  | 'recording'
  | 'report'
  | 'log'
  | 'evidence';

/**
 * Integrity status.
 */
export type IntegrityStatus = 'compliant' | 'warning' | 'violation';

/**
 * Outcome summary.
 */
export interface OutcomeSummary {
  overview: string;
  keyPoints: string[];
  participantHighlights?: Record<string, string>;
}

/**
 * Criteria score.
 */
export interface CriteriaScore {
  score: number;
  maxScore: number;
  feedback?: string;
}

/**
 * Outcome evaluation.
 */
export interface OutcomeEvaluation {
  rubricId: string;
  rubricName?: string;
  overallScore: number;
  maxScore?: number;
  criteriaScores: Record<string, CriteriaScore>;
}

/**
 * Outcome decision.
 */
export interface OutcomeDecision {
  recommendation: string;
  confidence: number;
  rationale: string;
  nextSteps?: string[];
}

/**
 * Outcome integrity.
 */
export interface OutcomeIntegrity {
  status: IntegrityStatus;
  violationCounts: Record<string, number>;
  details?: string[];
}

/**
 * Outcome entity.
 */
export interface Outcome {
  id: string;
  tenantId: string;
  sessionId: string;
  sessionTitle?: string;
  workspaceId?: string;
  workspaceName?: string;
  status: OutcomeStatus;
  summary?: OutcomeSummary;
  evaluation?: OutcomeEvaluation;
  decision?: OutcomeDecision;
  integrity?: OutcomeIntegrity;
  generatedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionNote?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Outcome artifact.
 */
export interface OutcomeArtifact {
  id: string;
  outcomeId: string;
  type: ArtifactType;
  name: string;
  description?: string;
  mimeType?: string;
  sizeBytes?: number;
  redacted: boolean;
  createdAt: string;
}

/**
 * Filter parameters for listing outcomes.
 */
export interface OutcomeListParams {
  page?: number;
  limit?: number;
  status?: OutcomeStatus;
  workspaceId?: string;
  startDate?: string;
  endDate?: string;
  orderBy?: 'createdAt' | 'updatedAt';
  orderDirection?: 'asc' | 'desc';
}

/**
 * Paginated outcomes response.
 */
export interface PaginatedOutcomesResponse {
  data: Outcome[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Reject outcome input.
 */
export interface RejectOutcomeInput {
  note: string;
}

/**
 * Human-readable labels for outcome status.
 */
export const outcomeStatusLabels: Record<OutcomeStatus, string> = {
  pending: 'Pending',
  generating: 'Generating',
  ready: 'Ready for Review',
  approved: 'Approved',
  rejected: 'Rejected',
  failed: 'Failed',
};

/**
 * Human-readable labels for artifact types.
 */
export const artifactTypeLabels: Record<ArtifactType, string> = {
  transcript: 'Transcript',
  recording: 'Recording',
  report: 'Report',
  log: 'Activity Log',
  evidence: 'Evidence',
};

/**
 * Human-readable labels for integrity status.
 */
export const integrityStatusLabels: Record<IntegrityStatus, string> = {
  compliant: 'Compliant',
  warning: 'Warning',
  violation: 'Violation',
};
