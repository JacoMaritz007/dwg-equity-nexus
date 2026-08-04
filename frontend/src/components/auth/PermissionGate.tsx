import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PermissionGateProps {
  children: React.ReactNode;
  role?: string;
  resource?: string;
  action?: string;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  role,
  resource,
  action = 'read',
  fallback = null,
}) => {
  const { hasRole, canAccess } = useAuth();

  let hasAccess = false;

  if (role) {
    hasAccess = hasRole(role);
  } else if (resource) {
    hasAccess = canAccess(resource, action);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};