import React, { useState, useEffect } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';

type AuthView = 'login' | 'register';

export const AuthPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const isVerificationPrompt = searchParams.get('verify') === 'true';

  useEffect(() => {
    // Set initial view based on URL params
    if (searchParams.get('view') === 'register') {
      setCurrentView('register');
    }
  }, [searchParams]);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {isVerificationPrompt && (
          <div className="mb-8">
            <Alert className="border-success bg-success/10">
              <CheckCircle className="h-4 w-4 text-success" />
              <AlertDescription className="text-success">
                <strong>Registration successful!</strong> Please check your email and click the verification link to activate your account.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {currentView === 'login' ? (
          <LoginForm
            onShowRegister={() => setCurrentView('register')}
            onShowForgotPassword={() => setShowForgotPassword(true)}
          />
        ) : (
          <RegisterForm
            onShowLogin={() => setCurrentView('login')}
          />
        )}

        <ForgotPasswordModal
          isOpen={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
        />
      </div>
    </div>
  );
};