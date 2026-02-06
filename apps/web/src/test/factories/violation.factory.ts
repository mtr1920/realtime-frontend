/**
 * Violation Test Factory
 *
 * Create mock compliance violation data for testing.
 */

import type {
  ComplianceViolation,
  ViolationType,
  ViolationSeverity,
  ViolationAction,
} from '@/features/compliance/types/compliance.types';

// =============================================================================
// Default Values
// =============================================================================

const DEFAULT_VIOLATION: ComplianceViolation = {
  id: 'violation-001',
  type: 'tab_switch',
  severity: 'medium',
  action: 'warned',
  message: 'Tab switch detected',
  timestamp: new Date().toISOString(),
};

// =============================================================================
// Type Constants for Testing
// =============================================================================

export const VIOLATION_TYPES: ViolationType[] = [
  'tab_switch',
  'window_blur',
  'copy_paste',
  'keyboard_shortcut',
  'screen_capture_attempt',
  'multiple_faces',
  'no_face',
  'suspicious_audio',
  'custom',
];

export const SEVERITY_LEVELS: ViolationSeverity[] = [
  'info',
  'low',
  'medium',
  'high',
  'critical',
];

export const VIOLATION_ACTIONS: ViolationAction[] = [
  'logged',
  'warned',
  'paused',
  'terminated',
];

// =============================================================================
// Factory Functions
// =============================================================================

let violationIdCounter = 0;

/**
 * Create a mock violation with optional overrides.
 */
export function createMockViolation(
  overrides: Partial<ComplianceViolation> = {}
): ComplianceViolation {
  violationIdCounter++;
  return {
    ...DEFAULT_VIOLATION,
    id: `violation-${String(violationIdCounter).padStart(3, '0')}`,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a violation with specific type.
 */
export function createViolationOfType(
  type: ViolationType,
  overrides: Partial<ComplianceViolation> = {}
): ComplianceViolation {
  const messages: Record<ViolationType, string> = {
    tab_switch: 'Tab switch detected',
    window_blur: 'Window lost focus',
    copy_paste: 'Copy/paste operation detected',
    keyboard_shortcut: 'Restricted keyboard shortcut used',
    screen_capture_attempt: 'Screen capture attempt detected',
    multiple_faces: 'Multiple faces detected in frame',
    no_face: 'No face detected in frame',
    suspicious_audio: 'Suspicious audio detected',
    custom: 'Custom violation',
  };

  return createMockViolation({
    type,
    message: messages[type],
    ...overrides,
  });
}

/**
 * Create a violation with specific severity.
 */
export function createViolationWithSeverity(
  severity: ViolationSeverity,
  overrides: Partial<ComplianceViolation> = {}
): ComplianceViolation {
  return createMockViolation({
    severity,
    ...overrides,
  });
}

/**
 * Create a critical violation.
 */
export function createCriticalViolation(
  overrides: Partial<ComplianceViolation> = {}
): ComplianceViolation {
  return createMockViolation({
    type: 'multiple_faces',
    severity: 'critical',
    action: 'paused',
    message: 'Critical: Multiple faces detected - session paused',
    ...overrides,
  });
}

/**
 * Create an info-level violation.
 */
export function createInfoViolation(
  overrides: Partial<ComplianceViolation> = {}
): ComplianceViolation {
  return createMockViolation({
    severity: 'info',
    action: 'logged',
    ...overrides,
  });
}

/**
 * Create multiple violations for testing queue behavior.
 */
export function createViolationBatch(count: number): ComplianceViolation[] {
  return Array.from({ length: count }, (_, i) => {
    const severity = SEVERITY_LEVELS[i % SEVERITY_LEVELS.length] || 'medium';
    const type = VIOLATION_TYPES[i % VIOLATION_TYPES.length] || 'tab_switch';
    return createMockViolation({
      type,
      severity,
      message: `Violation ${i + 1}: ${type}`,
    });
  });
}

/**
 * Create a violation with details.
 */
export function createViolationWithDetails(
  details: Record<string, unknown>,
  overrides: Partial<ComplianceViolation> = {}
): ComplianceViolation {
  return createMockViolation({
    details,
    ...overrides,
  });
}

/**
 * Reset the violation ID counter (call in beforeEach for deterministic IDs).
 */
export function resetViolationIdCounter(): void {
  violationIdCounter = 0;
}
