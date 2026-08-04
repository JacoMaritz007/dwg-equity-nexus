import { useAuth } from '@/contexts/AuthContext';

export const usePermissions = () => {
  const { user, hasRole, canAccess } = useAuth();

  return {
    user,
    hasRole,
    canAccess,
    isAdmin: () => hasRole('admin'),
    isInvestor: () => hasRole('investor'),
    canViewInvestments: () => canAccess('investments', 'read'),
    canCreateInvestments: () => canAccess('investments', 'create'),
    canManageProfiles: () => canAccess('profiles', 'write'),
    canViewTransactions: () => canAccess('transactions', 'read'),
    canManageAccounts: () => canAccess('accounts', 'write'),
    // Was `hasRole('admin') || hasPermission('admin:access')` — the
    // permission-string path came from the same spoofable user_metadata
    // source as the old role check, so it's gone along with it. Admin
    // access is role-only now.
    canAccessAdmin: () => hasRole('admin'),
  };
};
