---
title: "10. Authentication & Authorization"
original_path: "/home/mtr/Projects/RealtimeApp/realtime-frontend/DevelopmentProcess/frontend/Frontend-Development-Plan.md"
---

## 10. Authentication & Authorization

### 8.1 Auth Service

```typescript
// services/auth.service.ts
import { apiClient } from './api-client';

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  tenantSlug: string;
}

class AuthService {
  private tokens: AuthTokens | null = null;
  private refreshPromise: Promise<AuthTokens> | null = null;

  async login(credentials: LoginCredentials): Promise<User> {
    const response = await apiClient.post<{ user: User; tokens: AuthTokens }>(
      '/auth/login',
      credentials
    );

    this.tokens = response.tokens;
    this.persistTokens();

    return response.user;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      this.tokens = null;
      localStorage.removeItem('auth_tokens');
    }
  }

  async getRealtimeToken(sessionId: string): Promise<string> {
    const response = await apiClient.post<{ token: string }>(
      '/auth/realtime-token',
      { sessionId }
    );
    return response.token;
  }

  getAccessToken(): string | null {
    return this.tokens?.accessToken ?? null;
  }

  async ensureValidToken(): Promise<string> {
    if (!this.tokens) {
      throw new Error('Not authenticated');
    }

    // Check if token is about to expire (within 60 seconds)
    if (this.tokens.expiresAt - Date.now() < 60000) {
      return this.refreshAccessToken();
    }

    return this.tokens.accessToken;
  }

  private async refreshAccessToken(): Promise<string> {
    // Deduplicate refresh requests
    if (this.refreshPromise) {
      const tokens = await this.refreshPromise;
      return tokens.accessToken;
    }

    this.refreshPromise = this.doRefresh();

    try {
      const tokens = await this.refreshPromise;
      return tokens.accessToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async doRefresh(): Promise<AuthTokens> {
    const response = await apiClient.post<AuthTokens>('/auth/refresh', {
      refreshToken: this.tokens?.refreshToken,
    });

    this.tokens = response;
    this.persistTokens();

    return response;
  }

  private persistTokens(): void {
    if (this.tokens) {
      localStorage.setItem('auth_tokens', JSON.stringify(this.tokens));
    }
  }

  loadPersistedTokens(): void {
    const stored = localStorage.getItem('auth_tokens');
    if (stored) {
      this.tokens = JSON.parse(stored);
    }
  }
}

export const authService = new AuthService();
```

### 8.2 Permission Hook

```typescript
// features/auth/hooks/usePermissions.ts
import { useMemo } from 'react';
import { useSessionStore } from '@/stores/session.store';
import { RolePermissions } from '@protocol/types';

export function usePermissions(): RolePermissions & { hasPermission: (key: keyof RolePermissions) => boolean } {
  const myRole = useSessionStore((state) => state.myRole);

  const permissions = useMemo(() => {
    const defaultPermissions: RolePermissions = {
      canPublishAudio: false,
      canPublishVideo: false,
      canShareScreen: false,
      canViewOthersVideo: true,
      canViewOthersScreen: true,
      canStartSession: false,
      canEndSession: false,
      canPauseSession: false,
      canRemoveParticipants: false,
      canMuteOthers: false,
      canSendMessages: false,
      canViewTranscripts: false,
      canViewRecordings: false,
      canDownloadRecordings: false,
      canExportData: false,
      canInteractWithAI: false,
      canConfigureAi: false,
      canViewAiAnalytics: false,
      canViewComplianceData: false,
      canTriggerComplianceActions: false,
    };

    if (!myRole) return defaultPermissions;

    return { ...defaultPermissions, ...myRole.permissions };
  }, [myRole]);

  const hasPermission = (key: keyof RolePermissions): boolean => {
    return permissions[key] ?? false;
  };

  return { ...permissions, hasPermission };
}
```

### 8.3 Protected Route Component

```typescript
// features/auth/components/ProtectedRoute.tsx
import { Navigate, useLocation } from '@tanstack/react-router';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  requiredRoles,
  fallback,
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return fallback ?? <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" search={{ redirect: location.pathname }} />;
  }

  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
}
```

---
