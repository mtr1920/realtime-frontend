/**
 * Auth Feature Module
 * Public exports for authentication functionality.
 */

// Components
export { LoginForm } from './components/LoginForm';
export { ForgotPasswordForm } from './components/ForgotPasswordForm';
export { ResetPasswordForm } from './components/ResetPasswordForm';
export { ProtectedRoute } from './components/ProtectedRoute';
export { PermissionGate } from './components/PermissionGate';
export { SSOButtons, type SSOProvider } from './components/SSOButtons';

// Hooks
export { useAuth, type AuthContextValue } from './hooks/useAuth';
export { useLogin } from './hooks/useLogin';
export { useForgotPassword } from './hooks/useForgotPassword';
export { useResetPassword } from './hooks/useResetPassword';
export { useSSOLogin } from './hooks/useSSOLogin';
// Re-export from shared (canonical location)
export { useLogout, usePermissions, useCurrentUser, type Permission } from '@/shared/hooks';

// Schemas
export {
  loginSchema,
  type LoginFormData,
  userRoleSchema,
  type UserRole,
  registrationSchema,
  type RegistrationFormData,
  passwordResetRequestSchema,
  type PasswordResetRequestFormData,
  passwordResetSchema,
  type PasswordResetFormData,
} from './schemas/auth.schema';
