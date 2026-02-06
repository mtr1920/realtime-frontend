/**
 * Domain Config Templates
 *
 * Pre-defined configuration templates for different use cases.
 * These templates provide sensible defaults that can be customized.
 */

import type { DomainType } from '../types/domain-configs.types';

// =============================================================================
// Types
// =============================================================================

export interface ConfigTemplate {
  /** Template ID */
  id: string;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Domain type this template is for */
  domainType: DomainType;
  /** Tags for filtering */
  tags: string[];
  /** The configuration JSON */
  configJson: Record<string, unknown>;
}

// =============================================================================
// Interview Templates
// =============================================================================

const interviewStandardTemplate: ConfigTemplate = {
  id: 'interview-standard',
  name: 'Standard Interview',
  description: 'Full-featured interview with recording, compliance, and AI interviewer.',
  domainType: 'interview',
  tags: ['recording', 'compliance', 'ai'],
  configJson: {
    roles: [
      {
        id: 'interviewer',
        label: 'Interviewer',
        maxParticipants: 5,
        permissions: {
          canEndSession: true,
          canMuteParticipants: true,
          canRemoveParticipants: true,
          canManageRecording: true,
          canViewTranscript: true,
        },
      },
      {
        id: 'candidate',
        label: 'Candidate',
        maxParticipants: 1,
        permissions: {
          canEndSession: false,
          canMuteParticipants: false,
          canRemoveParticipants: false,
          canManageRecording: false,
          canViewTranscript: false,
        },
      },
      {
        id: 'observer',
        label: 'Observer',
        maxParticipants: 10,
        isObserver: true,
        permissions: {
          canViewTranscript: true,
          canViewRecording: true,
        },
      },
    ],
    recording: {
      enabled: true,
      consentType: 'explicit',
      retentionDays: 90,
      includeAIAudio: true,
    },
    compliance: {
      enabled: true,
      browserLock: true,
      identityVerification: true,
      inactivityTimeout: 120,
    },
    ai: {
      enabled: true,
      provider: 'openai',
      actors: [
        {
          id: 'ai-interviewer',
          name: 'AI Interviewer',
          role: 'interviewer',
          persona: {
            description: 'Professional technical interviewer who evaluates candidates fairly.',
            style: 'professional',
            traits: ['thorough', 'patient', 'direct'],
          },
          voice: {
            voiceId: 'alloy',
            voiceName: 'Alloy',
            gender: 'neutral',
          },
        },
      ],
    },
    outcomes: ['transcript', 'summary', 'evaluation'],
  },
};

const interviewPanelTemplate: ConfigTemplate = {
  id: 'interview-panel',
  name: 'Panel Interview',
  description: 'Multi-interviewer panel format with collaborative evaluation.',
  domainType: 'interview',
  tags: ['panel', 'collaborative'],
  configJson: {
    roles: [
      {
        id: 'lead_interviewer',
        label: 'Lead Interviewer',
        maxParticipants: 1,
        permissions: {
          canEndSession: true,
          canMuteParticipants: true,
          canRemoveParticipants: true,
          canManageRecording: true,
          canViewTranscript: true,
        },
      },
      {
        id: 'panel_member',
        label: 'Panel Member',
        maxParticipants: 4,
        permissions: {
          canEndSession: false,
          canMuteParticipants: false,
          canRemoveParticipants: false,
          canManageRecording: false,
          canViewTranscript: true,
        },
      },
      {
        id: 'candidate',
        label: 'Candidate',
        maxParticipants: 1,
        permissions: {},
      },
    ],
    recording: {
      enabled: true,
      consentType: 'explicit',
      retentionDays: 90,
    },
    compliance: {
      enabled: false,
    },
    ai: {
      enabled: false,
    },
    outcomes: ['transcript', 'summary'],
  },
};

// =============================================================================
// Pre-sales Templates
// =============================================================================

const presalesStandardTemplate: ConfigTemplate = {
  id: 'presales-standard',
  name: 'Standard Demo',
  description: 'Product demonstration with AI assistant support.',
  domainType: 'presales',
  tags: ['demo', 'ai-assistant'],
  configJson: {
    roles: [
      {
        id: 'sales_rep',
        label: 'Sales Representative',
        maxParticipants: 3,
        permissions: {
          canEndSession: true,
          canMuteParticipants: true,
          canManageRecording: true,
          canViewTranscript: true,
        },
      },
      {
        id: 'prospect',
        label: 'Prospect',
        maxParticipants: 10,
        permissions: {
          canEndSession: false,
          canViewTranscript: false,
        },
      },
    ],
    recording: {
      enabled: false,
    },
    compliance: {
      enabled: false,
    },
    ai: {
      enabled: true,
      provider: 'openai',
      actors: [
        {
          id: 'ai-assistant',
          name: 'Sales Assistant',
          role: 'assistant',
          persona: {
            description: 'Helpful sales assistant that provides product information.',
            style: 'friendly',
            traits: ['supportive', 'concise', 'patient'],
          },
          voice: {
            voiceId: 'nova',
            voiceName: 'Nova',
            gender: 'female',
          },
        },
      ],
    },
    outcomes: ['summary', 'follow_up_actions'],
  },
};

// =============================================================================
// Training Templates
// =============================================================================

const trainingCoachingTemplate: ConfigTemplate = {
  id: 'training-coaching',
  name: 'Coaching Session',
  description: 'One-on-one coaching with AI coach support.',
  domainType: 'training',
  tags: ['coaching', 'ai-coach'],
  configJson: {
    roles: [
      {
        id: 'coach',
        label: 'Coach',
        maxParticipants: 1,
        permissions: {
          canEndSession: true,
          canMuteParticipants: true,
          canManageRecording: true,
          canViewTranscript: true,
        },
      },
      {
        id: 'trainee',
        label: 'Trainee',
        maxParticipants: 1,
        permissions: {
          canEndSession: false,
          canViewTranscript: true,
        },
      },
    ],
    recording: {
      enabled: false,
    },
    compliance: {
      enabled: false,
    },
    ai: {
      enabled: true,
      provider: 'openai',
      actors: [
        {
          id: 'ai-coach',
          name: 'AI Coach',
          role: 'coach',
          persona: {
            description: 'Encouraging coach that provides feedback and guidance.',
            style: 'empathetic',
            traits: ['encouraging', 'supportive', 'patient'],
          },
          voice: {
            voiceId: 'fable',
            voiceName: 'Fable',
            gender: 'neutral',
          },
        },
      ],
    },
    outcomes: ['transcript', 'feedback'],
  },
};

const trainingGroupTemplate: ConfigTemplate = {
  id: 'training-group',
  name: 'Group Training',
  description: 'Multi-participant training session with instructor.',
  domainType: 'training',
  tags: ['group', 'instructor-led'],
  configJson: {
    roles: [
      {
        id: 'instructor',
        label: 'Instructor',
        maxParticipants: 2,
        permissions: {
          canEndSession: true,
          canMuteParticipants: true,
          canRemoveParticipants: true,
          canManageRecording: true,
          canViewTranscript: true,
        },
      },
      {
        id: 'participant',
        label: 'Participant',
        maxParticipants: 50,
        permissions: {
          canViewTranscript: true,
        },
      },
    ],
    recording: {
      enabled: true,
      consentType: 'implicit',
      retentionDays: 365,
    },
    compliance: {
      enabled: false,
    },
    ai: {
      enabled: false,
    },
    outcomes: ['recording', 'transcript'],
  },
};

// =============================================================================
// Support Templates
// =============================================================================

const supportStandardTemplate: ConfigTemplate = {
  id: 'support-standard',
  name: 'Customer Support',
  description: 'Standard support session with agent and analytics.',
  domainType: 'support',
  tags: ['agent', 'analytics'],
  configJson: {
    roles: [
      {
        id: 'agent',
        label: 'Support Agent',
        maxParticipants: 2,
        permissions: {
          canEndSession: true,
          canMuteParticipants: true,
          canManageRecording: true,
          canViewTranscript: true,
        },
      },
      {
        id: 'customer',
        label: 'Customer',
        maxParticipants: 1,
        permissions: {
          canEndSession: true,
        },
      },
      {
        id: 'supervisor',
        label: 'Supervisor',
        maxParticipants: 3,
        isObserver: true,
        permissions: {
          canViewTranscript: true,
          canViewRecording: true,
        },
      },
    ],
    recording: {
      enabled: true,
      consentType: 'explicit',
      retentionDays: 30,
    },
    compliance: {
      enabled: false,
    },
    ai: {
      enabled: true,
      provider: 'openai',
      actors: [
        {
          id: 'ai-assistant',
          name: 'Support Assistant',
          role: 'assistant',
          persona: {
            description: 'Helpful support assistant that provides troubleshooting guidance.',
            style: 'empathetic',
            traits: ['patient', 'supportive', 'thorough'],
          },
          voice: {
            voiceId: 'shimmer',
            voiceName: 'Shimmer',
            gender: 'female',
          },
        },
      ],
    },
    outcomes: ['transcript', 'summary', 'ticket_notes'],
  },
};

// =============================================================================
// HR Templates
// =============================================================================

const hrOnboardingTemplate: ConfigTemplate = {
  id: 'hr-onboarding',
  name: 'Employee Onboarding',
  description: 'New employee onboarding session.',
  domainType: 'hr',
  tags: ['onboarding', 'new-hire'],
  configJson: {
    roles: [
      {
        id: 'hr_manager',
        label: 'HR Manager',
        maxParticipants: 2,
        permissions: {
          canEndSession: true,
          canMuteParticipants: true,
          canManageRecording: true,
          canViewTranscript: true,
        },
      },
      {
        id: 'new_employee',
        label: 'New Employee',
        maxParticipants: 5,
        permissions: {
          canViewTranscript: true,
        },
      },
    ],
    recording: {
      enabled: true,
      consentType: 'implicit',
      retentionDays: 365,
    },
    compliance: {
      enabled: false,
    },
    ai: {
      enabled: false,
    },
    outcomes: ['recording'],
  },
};

// =============================================================================
// Consultation Templates
// =============================================================================

const consultationStandardTemplate: ConfigTemplate = {
  id: 'consultation-standard',
  name: 'Standard Consultation',
  description: 'Professional consultation with recording.',
  domainType: 'consultation',
  tags: ['professional', 'recorded'],
  configJson: {
    roles: [
      {
        id: 'consultant',
        label: 'Consultant',
        maxParticipants: 3,
        permissions: {
          canEndSession: true,
          canMuteParticipants: true,
          canManageRecording: true,
          canViewTranscript: true,
        },
      },
      {
        id: 'client',
        label: 'Client',
        maxParticipants: 5,
        permissions: {
          canEndSession: true,
          canViewTranscript: true,
        },
      },
    ],
    recording: {
      enabled: true,
      consentType: 'explicit',
      retentionDays: 180,
    },
    compliance: {
      enabled: false,
    },
    ai: {
      enabled: false,
    },
    outcomes: ['transcript', 'summary', 'action_items'],
  },
};

// =============================================================================
// Custom Template (Minimal)
// =============================================================================

const customMinimalTemplate: ConfigTemplate = {
  id: 'custom-minimal',
  name: 'Minimal Setup',
  description: 'Bare-bones configuration for custom implementations.',
  domainType: 'custom',
  tags: ['minimal', 'custom'],
  configJson: {
    roles: [
      {
        id: 'host',
        label: 'Host',
        maxParticipants: 1,
        permissions: {
          canEndSession: true,
          canMuteParticipants: true,
        },
      },
      {
        id: 'participant',
        label: 'Participant',
        maxParticipants: 20,
        permissions: {},
      },
    ],
    recording: {
      enabled: false,
    },
    compliance: {
      enabled: false,
    },
    ai: {
      enabled: false,
    },
    outcomes: [],
  },
};

// =============================================================================
// All Templates
// =============================================================================

export const configTemplates: ConfigTemplate[] = [
  // Interview
  interviewStandardTemplate,
  interviewPanelTemplate,
  // Pre-sales
  presalesStandardTemplate,
  // Training
  trainingCoachingTemplate,
  trainingGroupTemplate,
  // Support
  supportStandardTemplate,
  // HR
  hrOnboardingTemplate,
  // Consultation
  consultationStandardTemplate,
  // Custom
  customMinimalTemplate,
];

// =============================================================================
// Helpers
// =============================================================================

/**
 * Get templates for a specific domain type.
 */
export function getTemplatesForDomain(domainType: DomainType): ConfigTemplate[] {
  return configTemplates.filter((t) => t.domainType === domainType);
}

/**
 * Get a template by ID.
 */
export function getTemplateById(id: string): ConfigTemplate | undefined {
  return configTemplates.find((t) => t.id === id);
}

/**
 * Get templates by tag.
 */
export function getTemplatesByTag(tag: string): ConfigTemplate[] {
  return configTemplates.filter((t) => t.tags.includes(tag));
}
