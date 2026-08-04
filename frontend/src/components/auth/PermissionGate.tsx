import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PermissionGateProps {
  children: React.ReactNode;
  permission?: string;
  role?: string;
  resource?: string;
  action?: string;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permission,
  role,
  resource,
  action = 'read',
  fallback = null,
}) => {
  const { hasPermission, hasRole, canAccess } = useAuth();

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (role) {
    hasAccess = hasRole(role);
  } else if (resource) {
    hasAccess = canAccess(resource, action);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};