import { useAuth } from '@/contexts/AuthContext';

export const usePermissions = () => {
  const { user, hasPermission, hasRole, canAccess } = useAuth();

  return {
    user,
    hasPermission,
    hasRole,
    canAccess,
    isAdmin: () => hasRole('admin'),
    isInvestor: () => hasRole('investor'),
    canViewInvestments: () => canAccess('investments', 'read'),
    canCreateInvestments: () => canAccess('investments', 'create'),
    canManageProfiles: () => canAccess('profiles', 'write'),
    canViewTransactions: () => canAccess('transactions', 'read'),
    canManageAccounts: () => canAccess('accounts', 'write'),
    canAccessAdmin: () => hasRole('admin') || hasPermission('admin:access'),
  };
};