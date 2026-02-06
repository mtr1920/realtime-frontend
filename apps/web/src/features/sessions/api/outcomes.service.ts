/**
 * Outcomes Service
 * Handles session outcome API calls.
 */

import { apiClient } from '@/shared/services/api-client';
import { isApiError } from '@/shared/errors';

// =============================================================================
// Types (aligned with @realtime-platform/contracts/api/outcomes.ts)
// =============================================================================

export type OutcomeStatus =
  | 'pending'
  | 'generating'
  | 'ready'
  | 'approved'
  | 'rejected'
  | 'failed';

export interface OutcomeSummary {
  overview: string;
  keyPoints: string[];
  participantHighlights?: Record<string, string>;
  generatedAt: string;
  generatedBy: string;
}

export interface BackendCriteriaScore {
  score: number;
  maxScore: number;
  feedback?: string;
}

export interface OutcomeEvaluation {
  rubricId: string;
  overallScore: number;
  criteriaScores: Record<string, BackendCriteriaScore>;
  strengths: string[];
  improvements: string[];
  generatedAt: string;
  generatedBy: string;
}

export interface OutcomeDecision {
  recommendation: string;
  confidence: number;
  rationale: string;
  nextSteps?: string[];
  generatedAt: string;
  generatedBy: string;
}

export interface OutcomeIntegrityEvent {
  timestamp: string;
  type: string;
  description: string;
}

export interface OutcomeIntegrity {
  status: 'compliant' | 'warning' | 'violation';
  violationCounts: Record<string, number>;
  notableEvents: OutcomeIntegrityEvent[];
  verificationResults?: Record<string, boolean>;
  generatedAt: string;
}

export interface SessionOutcomeResponse {
  id: string;
  tenantId: string;
  sessionId: string;
  status: OutcomeStatus;
  summary: OutcomeSummary | null;
  evaluation: OutcomeEvaluation | null;
  decision: OutcomeDecision | null;
  integrity: OutcomeIntegrity | null;
  generatedAt: string | null;
  generatedBy: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  rejectedAt: string | null;
  rejectedBy: string | null;
  rejectionNote: string | null;
  errorMessage: string | null;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RejectOutcomeInput {
  rejectionNote?: string;
}

// =============================================================================
// Service Class
// =============================================================================

class OutcomesService {
  private readonly basePath = '/v1/outcomes';

  /**
   * Get outcome for a session by session ID.
   * Returns null if no outcome exists (404).
   */
  async getBySessionId(sessionId: string): Promise<SessionOutcomeResponse | null> {
    try {
      const response = await apiClient.get<{ outcome: SessionOutcomeResponse }>(
        `/v1/sessions/${sessionId}/outcome`
      );
      return response.outcome;
    } catch (error) {
      // Return null if outcome doesn't exist yet
      if (isApiError(error) && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get outcome by ID.
   */
  async get(outcomeId: string): Promise<SessionOutcomeResponse> {
    const response = await apiClient.get<{ outcome: SessionOutcomeResponse }>(
      `${this.basePath}/${outcomeId}`
    );
    return response.outcome;
  }

  /**
   * Approve an outcome by session ID.
   * Endpoint: POST /sessions/:sessionId/outcome/approve
   */
  async approveBySessionId(sessionId: string): Promise<SessionOutcomeResponse> {
    const response = await apiClient.post<{ outcome: SessionOutcomeResponse }>(
      `/v1/sessions/${sessionId}/outcome/approve`
    );
    return response.outcome;
  }

  /**
   * Reject an outcome by session ID.
   * Endpoint: POST /sessions/:sessionId/outcome/reject
   */
  async rejectBySessionId(
    sessionId: string,
    input: RejectOutcomeInput = {}
  ): Promise<SessionOutcomeResponse> {
    const response = await apiClient.post<{ outcome: SessionOutcomeResponse }>(
      `/v1/sessions/${sessionId}/outcome/reject`,
      input
    );
    return response.outcome;
  }
}

// Export singleton instance
export const outcomesService = new OutcomesService();
