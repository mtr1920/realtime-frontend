/**
 * Auth Context re-export.
 * The actual implementation lives in @/shared/model to avoid FSD violations.
 */

export {
  AuthContext,
  useAuthContext,
  type AuthContextValue,
} from '@/shared/model/auth.context';
