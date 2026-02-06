/**
 * useRoleConfig Hook
 *
 * Configuration-driven role display helper.
 * Use this hook to get role labels and colors from session config.
 * Falls back to sensible defaults when config is not available.
 */

import { useCallback, useMemo } from 'react';
import {
  User,
  UserCheck,
  Eye,
  Crown,
  Shield,
  Users,
  Bot,
  type LucideIcon,
} from 'lucide-react';
import { useSessionConfig } from './useSessionConfig';

/** Default color for roles not in the mapping */
const DEFAULT_COLOR = 'text-foreground';

/**
 * Default color mappings for common role patterns.
 * These serve as fallbacks when role metadata is not configured.
 */
const DEFAULT_ROLE_COLORS = {
  // Generic roles
  host: 'text-blue-600 dark:text-blue-400',
  participant: 'text-green-600 dark:text-green-400',
  observer: 'text-gray-500 dark:text-gray-400',
  moderator: 'text-amber-600 dark:text-amber-400',

  // AI-related
  ai: 'text-purple-600 dark:text-purple-400',
  assistant: 'text-purple-600 dark:text-purple-400',
  bot: 'text-purple-600 dark:text-purple-400',
} as const;

type RoleColorKey = keyof typeof DEFAULT_ROLE_COLORS;

/**
 * Default icon mappings for common roles.
 */
const DEFAULT_ROLE_ICONS: Record<string, LucideIcon> = {
  candidate: User,
  interviewer: UserCheck,
  observer: Eye,
  viewer: Eye,
  facilitator: Crown,
  host: Crown,
  moderator: Shield,
  participant: Users,
  ai: Bot,
  assistant: Bot,
  bot: Bot,
};

/**
 * Avatar color mappings (background + foreground) for common roles.
 */
const DEFAULT_AVATAR_COLORS: Record<string, { bg: string; fg: string }> = {
  candidate: {
    bg: 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800',
    fg: 'text-green-700 dark:text-green-300',
  },
  interviewer: {
    bg: 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800',
    fg: 'text-blue-700 dark:text-blue-300',
  },
  observer: {
    bg: 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600',
    fg: 'text-gray-600 dark:text-gray-300',
  },
  viewer: {
    bg: 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600',
    fg: 'text-gray-600 dark:text-gray-300',
  },
  facilitator: {
    bg: 'bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800',
    fg: 'text-amber-700 dark:text-amber-300',
  },
  host: {
    bg: 'bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800',
    fg: 'text-amber-700 dark:text-amber-300',
  },
  moderator: {
    bg: 'bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800',
    fg: 'text-amber-700 dark:text-amber-300',
  },
  participant: {
    bg: 'bg-gradient-to-br from-primary/20 to-primary/40',
    fg: 'text-primary-foreground',
  },
  ai: {
    bg: 'bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800',
    fg: 'text-purple-700 dark:text-purple-300',
  },
  assistant: {
    bg: 'bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800',
    fg: 'text-purple-700 dark:text-purple-300',
  },
  bot: {
    bg: 'bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800',
    fg: 'text-purple-700 dark:text-purple-300',
  },
};

/** Default avatar colors for unrecognized roles */
const DEFAULT_AVATAR_FALLBACK = {
  bg: 'bg-gradient-to-br from-primary/20 to-primary/40',
  fg: 'text-primary-foreground',
};

export interface UseRoleConfigResult {
  /**
   * Get display label for a role ID.
   * Returns the configured name from session config, or formats the ID as fallback.
   */
  getRoleLabel: (roleId: string) => string;

  /**
   * Get color class for a role.
   * Returns configured color from session config, or a default based on role patterns.
   */
  getRoleColor: (roleId: string) => string;

  /**
   * Get icon component for a role.
   * Returns a Lucide icon based on role patterns, or null for unrecognized roles.
   */
  getRoleIcon: (roleId: string) => LucideIcon | null;

  /**
   * Get avatar background and foreground colors for a role.
   * Returns role-specific gradient background and text color classes.
   */
  getRoleAvatarColors: (roleId: string) => { bg: string; fg: string };

  /**
   * Get full role config if available
   */
  getRole: (roleId: string) => { id: string; name: string; color?: string } | undefined;

  /**
   * List of all configured roles
   */
  roles: Array<{ id: string; name: string; color?: string }>;
}

/**
 * Format a role ID into a human-readable label.
 * Converts snake_case and kebab-case to Title Case.
 */
function formatRoleId(roleId: string): string {
  return roleId
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Get default color for a role based on common patterns.
 */
function getDefaultRoleColor(roleId: string): string {
  const normalizedRole = roleId.toLowerCase();

  // Check for exact match
  if (normalizedRole in DEFAULT_ROLE_COLORS) {
    return DEFAULT_ROLE_COLORS[normalizedRole as RoleColorKey];
  }

  // Check for partial matches
  if (normalizedRole.includes('host') || normalizedRole.includes('facilitator')) {
    return DEFAULT_ROLE_COLORS.host;
  }
  if (normalizedRole.includes('observer') || normalizedRole.includes('viewer')) {
    return DEFAULT_ROLE_COLORS.observer;
  }
  if (normalizedRole.includes('moderator')) {
    return DEFAULT_ROLE_COLORS.moderator;
  }
  if (normalizedRole.includes('ai') || normalizedRole.includes('bot') || normalizedRole.includes('assistant')) {
    return DEFAULT_ROLE_COLORS.ai;
  }

  return DEFAULT_COLOR;
}

/**
 * Get default icon for a role based on common patterns.
 */
function getDefaultRoleIcon(roleId: string): LucideIcon | null {
  const normalizedRole = roleId.toLowerCase();

  // Check for exact match
  if (normalizedRole in DEFAULT_ROLE_ICONS) {
    return DEFAULT_ROLE_ICONS[normalizedRole] ?? null;
  }

  // Check for partial matches
  if (normalizedRole.includes('candidate')) {
    return DEFAULT_ROLE_ICONS.candidate ?? null;
  }
  if (normalizedRole.includes('interviewer')) {
    return DEFAULT_ROLE_ICONS.interviewer ?? null;
  }
  if (normalizedRole.includes('host') || normalizedRole.includes('facilitator')) {
    return DEFAULT_ROLE_ICONS.host ?? null;
  }
  if (normalizedRole.includes('observer') || normalizedRole.includes('viewer')) {
    return DEFAULT_ROLE_ICONS.observer ?? null;
  }
  if (normalizedRole.includes('moderator')) {
    return DEFAULT_ROLE_ICONS.moderator ?? null;
  }
  if (normalizedRole.includes('ai') || normalizedRole.includes('bot') || normalizedRole.includes('assistant')) {
    return DEFAULT_ROLE_ICONS.ai ?? null;
  }

  return null;
}

/**
 * Get default avatar colors for a role based on common patterns.
 */
function getDefaultAvatarColors(roleId: string): { bg: string; fg: string } {
  const normalizedRole = roleId.toLowerCase();

  // Check for exact match
  if (normalizedRole in DEFAULT_AVATAR_COLORS) {
    return DEFAULT_AVATAR_COLORS[normalizedRole] ?? DEFAULT_AVATAR_FALLBACK;
  }

  // Check for partial matches
  if (normalizedRole.includes('candidate')) {
    return DEFAULT_AVATAR_COLORS.candidate ?? DEFAULT_AVATAR_FALLBACK;
  }
  if (normalizedRole.includes('interviewer')) {
    return DEFAULT_AVATAR_COLORS.interviewer ?? DEFAULT_AVATAR_FALLBACK;
  }
  if (normalizedRole.includes('host') || normalizedRole.includes('facilitator')) {
    return DEFAULT_AVATAR_COLORS.host ?? DEFAULT_AVATAR_FALLBACK;
  }
  if (normalizedRole.includes('observer') || normalizedRole.includes('viewer')) {
    return DEFAULT_AVATAR_COLORS.observer ?? DEFAULT_AVATAR_FALLBACK;
  }
  if (normalizedRole.includes('moderator')) {
    return DEFAULT_AVATAR_COLORS.moderator ?? DEFAULT_AVATAR_FALLBACK;
  }
  if (normalizedRole.includes('ai') || normalizedRole.includes('bot') || normalizedRole.includes('assistant')) {
    return DEFAULT_AVATAR_COLORS.ai ?? DEFAULT_AVATAR_FALLBACK;
  }

  return DEFAULT_AVATAR_FALLBACK;
}

/**
 * Hook for accessing role display configuration.
 *
 * @example
 * ```tsx
 * const { getRoleLabel, getRoleColor } = useRoleConfig();
 *
 * return (
 *   <span className={getRoleColor(participant.roleId)}>
 *     {getRoleLabel(participant.roleId)}
 *   </span>
 * );
 * ```
 */
export function useRoleConfig(): UseRoleConfigResult {
  const { config } = useSessionConfig();

  // Build role lookup map from config
  const roleMap = useMemo(() => {
    const map = new Map<string, { id: string; name: string; color?: string }>();

    if (config?.roles) {
      for (const role of config.roles) {
        map.set(role.id, {
          id: role.id,
          name: role.name,
          color: role.metadata?.color,
        });
      }
    }

    return map;
  }, [config?.roles]);

  const roles = useMemo(() => Array.from(roleMap.values()), [roleMap]);

  const getRole = useCallback(
    (roleId: string) => roleMap.get(roleId),
    [roleMap]
  );

  const getRoleLabel = useCallback(
    (roleId: string): string => {
      const role = roleMap.get(roleId);
      if (role?.name) {
        return role.name;
      }
      // Fallback: format the role ID
      return formatRoleId(roleId);
    },
    [roleMap]
  );

  const getRoleColor = useCallback(
    (roleId: string): string => {
      const role = roleMap.get(roleId);
      if (role?.color) {
        return role.color;
      }
      // Fallback: use pattern-based default color
      return getDefaultRoleColor(roleId);
    },
    [roleMap]
  );

  const getRoleIcon = useCallback(
    (roleId: string): LucideIcon | null => {
      return getDefaultRoleIcon(roleId);
    },
    []
  );

  const getRoleAvatarColors = useCallback(
    (roleId: string): { bg: string; fg: string } => {
      return getDefaultAvatarColors(roleId);
    },
    []
  );

  return {
    getRoleLabel,
    getRoleColor,
    getRoleIcon,
    getRoleAvatarColors,
    getRole,
    roles,
  };
}
