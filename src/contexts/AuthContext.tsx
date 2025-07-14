import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAccredited: boolean;
  profilesCount: number;
  lastLoginAt: string;
  role: 'investor' | 'admin' | 'viewer';
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  canAccess: (resource: string, action?: string) => boolean;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  residency: string;
  investmentIntent: string;
  isAccredited: boolean;
  referralSource: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing auth session
    const initAuth = async () => {
      try {
        const token = authService.getToken();
        if (token) {
          // Validate token and get user data
          const userData = await authService.validateToken(token);
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authService.clearTokens();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { user: userData, token, refreshToken } = await authService.login(email, password);
      authService.setTokens(token, refreshToken);
      setUser(userData);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setLoading(true);
      await authService.register(userData);
      // Registration successful - user needs to verify email
      navigate('/auth?verify=true');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.clearTokens();
    setUser(null);
    navigate('/auth');
  };

  const resetPassword = async (email: string) => {
    try {
      await authService.resetPassword(email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  // Authorization functions
  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) || false;
  };

  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  const canAccess = (resource: string, action: string = 'read'): boolean => {
    if (!user) return false;
    
    // Admin can access everything
    if (user.role === 'admin') return true;
    
    // Check specific permissions
    const permission = `${resource}:${action}`;
    return hasPermission(permission) || hasPermission(`${resource}:*`);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    resetPassword,
    isAuthenticated: !!user,
    hasPermission,
    hasRole,
    canAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};