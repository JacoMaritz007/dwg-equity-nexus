import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface AuthorizedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
  resource?: string;
  action?: string;
  fallbackPath?: string;
}

export const AuthorizedRoute: React.FC<AuthorizedRouteProps> = ({
  children,
  requiredPermission,
  requiredRole,
  resource,
  action = 'read',
  fallbackPath = '/dashboard',
}) => {
  const { isAuthenticated, loading, hasPermission, hasRole, canAccess } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Check authorization
  let hasAccess = true;

  if (requiredPermission) {
    hasAccess = hasPermission(requiredPermission);
  } else if (requiredRole) {
    hasAccess = hasRole(requiredRole);
  } else if (resource) {
    hasAccess = canAccess(resource, action);
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert className="border-destructive bg-destructive/10">
            <AlertDescription className="text-center space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Access Denied</h3>
                <p className="text-muted-foreground">
                  You don't have permission to access this page.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="w-full"
              >
                Go Back
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};