import { z } from 'zod';
/**
 * Session status
 */
export declare const SessionStatusSchema: z.ZodEnum<["scheduled", "lobby", "active", "paused", "ended"]>;
export type SessionStatus = z.infer<typeof SessionStatusSchema>;
/**
 * Session configuration
 */
export declare const SessionConfigSchema: z.ZodObject<{
    domainType: z.ZodString;
    enabledModules: z.ZodArray<z.ZodString, "many">;
    recording: z.ZodObject<{
        enabled: z.ZodBoolean;
        autoStart: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        autoStart: boolean;
    }, {
        enabled: boolean;
        autoStart: boolean;
    }>;
    ai: z.ZodObject<{
        enabled: z.ZodBoolean;
        provider: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        provider?: string | undefined;
    }, {
        enabled: boolean;
        provider?: string | undefined;
    }>;
    compliance: z.ZodObject<{
        enabled: z.ZodBoolean;
        browserLock: z.ZodBoolean;
        identityVerification: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        browserLock: boolean;
        identityVerification: boolean;
    }, {
        enabled: boolean;
        browserLock: boolean;
        identityVerification: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    recording: {
        enabled: boolean;
        autoStart: boolean;
    };
    domainType: string;
    enabledModules: string[];
    ai: {
        enabled: boolean;
        provider?: string | undefined;
    };
    compliance: {
        enabled: boolean;
        browserLock: boolean;
        identityVerification: boolean;
    };
}, {
    recording: {
        enabled: boolean;
        autoStart: boolean;
    };
    domainType: string;
    enabledModules: string[];
    ai: {
        enabled: boolean;
        provider?: string | undefined;
    };
    compliance: {
        enabled: boolean;
        browserLock: boolean;
        identityVerification: boolean;
    };
}>;
export type SessionConfig = z.infer<typeof SessionConfigSchema>;
/**
 * Session schema
 */
export declare const SessionSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    workspaceId: z.ZodString;
    status: z.ZodEnum<["scheduled", "lobby", "active", "paused", "ended"]>;
    title: z.ZodString;
    scheduledStartTime: z.ZodOptional<z.ZodString>;
    actualStartTime: z.ZodOptional<z.ZodString>;
    endTime: z.ZodOptional<z.ZodString>;
    config: z.ZodObject<{
        domainType: z.ZodString;
        enabledModules: z.ZodArray<z.ZodString, "many">;
        recording: z.ZodObject<{
            enabled: z.ZodBoolean;
            autoStart: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            autoStart: boolean;
        }, {
            enabled: boolean;
            autoStart: boolean;
        }>;
        ai: z.ZodObject<{
            enabled: z.ZodBoolean;
            provider: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            provider?: string | undefined;
        }, {
            enabled: boolean;
            provider?: string | undefined;
        }>;
        compliance: z.ZodObject<{
            enabled: z.ZodBoolean;
            browserLock: z.ZodBoolean;
            identityVerification: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            browserLock: boolean;
            identityVerification: boolean;
        }, {
            enabled: boolean;
            browserLock: boolean;
            identityVerification: boolean;
        }>;
    }, "strip", z.ZodTypeAny, {
        recording: {
            enabled: boolean;
            autoStart: boolean;
        };
        domainType: string;
        enabledModules: string[];
        ai: {
            enabled: boolean;
            provider?: string | undefined;
        };
        compliance: {
            enabled: boolean;
            browserLock: boolean;
            identityVerification: boolean;
        };
    }, {
        recording: {
            enabled: boolean;
            autoStart: boolean;
        };
        domainType: string;
        enabledModules: string[];
        ai: {
            enabled: boolean;
            provider?: string | undefined;
        };
        compliance: {
            enabled: boolean;
            browserLock: boolean;
            identityVerification: boolean;
        };
    }>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "ended" | "scheduled" | "lobby" | "active" | "paused";
    id: string;
    title: string;
    tenantId: string;
    workspaceId: string;
    config: {
        recording: {
            enabled: boolean;
            autoStart: boolean;
        };
        domainType: string;
        enabledModules: string[];
        ai: {
            enabled: boolean;
            provider?: string | undefined;
        };
        compliance: {
            enabled: boolean;
            browserLock: boolean;
            identityVerification: boolean;
        };
    };
    createdAt: string;
    updatedAt: string;
    scheduledStartTime?: string | undefined;
    actualStartTime?: string | undefined;
    endTime?: string | undefined;
}, {
    status: "ended" | "scheduled" | "lobby" | "active" | "paused";
    id: string;
    title: string;
    tenantId: string;
    workspaceId: string;
    config: {
        recording: {
            enabled: boolean;
            autoStart: boolean;
        };
        domainType: string;
        enabledModules: string[];
        ai: {
            enabled: boolean;
            provider?: string | undefined;
        };
        compliance: {
            enabled: boolean;
            browserLock: boolean;
            identityVerification: boolean;
        };
    };
    createdAt: string;
    updatedAt: string;
    scheduledStartTime?: string | undefined;
    actualStartTime?: string | undefined;
    endTime?: string | undefined;
}>;
export type Session = z.infer<typeof SessionSchema>;
//# sourceMappingURL=session.d.ts.map