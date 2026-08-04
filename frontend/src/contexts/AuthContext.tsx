import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  TwitterAuthProvider,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { api } from "@/lib/api-client";

// Keeps the same flat shape the rest of the app already expects (firstName,
// lastName, isAccredited directly on `user`) — deliberately NOT restructured
// into a nested `profile` object, to avoid rippling a breaking type change
// into every component that reads these fields before they've been
// migrated off Supabase. `roles` is the one field whose SOURCE changed:
// it now comes exclusively from the backend's /me endpoint (which reads the
// user_roles-equivalent table server-side), never from Firebase ID token
// claims or any client-writable field. This is the fix for the original
// app's role-spoofing gap — the old AuthContext also trusted
// `session.user.user_metadata.role`, a field any authenticated user could
// set on themselves via `supabase.auth.updateUser({ data: { role: 'admin' } })`.
// There is no equivalent trust path here.
export interface User {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  isAccredited?: boolean | null;
  kycVerified?: boolean | null;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signInWithTwitter: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
  canAccess: (resource: string, action?: string) => boolean;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

interface MeResponse {
  uid: string;
  roles: string[];
  profile: {
    firstName: string | null;
    lastName: string | null;
    isAccredited: boolean | null;
    kycVerified: boolean | null;
  } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadUser = async (fbUser: FirebaseUser) => {
    const me = await api.get<MeResponse>("/me");
    setUser({
      id: fbUser.uid,
      email: fbUser.email ?? "",
      firstName: me.profile?.firstName,
      lastName: me.profile?.lastName,
      isAccredited: me.profile?.isAccredited,
      kycVerified: me.profile?.kycVerified,
      roles: me.roles,
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          await loadUser(fbUser);
        } catch (error) {
          console.error("Failed to load user profile:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password,
      );
      // Replaces the old handle_new_user() Postgres trigger: explicitly
      // create the profile + default 'investor' role via the backend now
      // that there's no trigger on user creation to do it implicitly.
      await api.post("/profiles/bootstrap", {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
      });
      await loadUser(credential.user);
      navigate("/auth?verify=true");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    navigate("/auth");
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  // Google/GitHub/Twitter sign-in providers are not yet configured on
  // Identity Platform (deferred to when the production domain is known —
  // see backend README). These will throw a Firebase "operation not
  // supported" error until that's done.
  const signInWithGoogle = async () => {
    await signInWithPopup(auth, new GoogleAuthProvider());
    navigate("/dashboard");
  };
  const signInWithGitHub = async () => {
    await signInWithPopup(auth, new GithubAuthProvider());
    navigate("/dashboard");
  };
  const signInWithTwitter = async () => {
    await signInWithPopup(auth, new TwitterAuthProvider());
    navigate("/dashboard");
  };

  const refreshUser = async () => {
    if (firebaseUser) await loadUser(firebaseUser);
  };

  const hasRole = (role: string): boolean => user?.roles.includes(role) ?? false;

  const canAccess = (resource: string, action: string = "read"): boolean => {
    if (!user) return false;
    if (hasRole("admin")) return true;
    // Every remaining resource/action pair maps to "any authenticated user
    // may act on their own rows" — the backend's authz layer is what
    // actually scopes that to the caller's own uid. Write access to other
    // users' data (profiles, accounts) is admin-only.
    if (resource === "profiles" || resource === "accounts") return action === "read";
    return true;
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    login,
    register,
    logout,
    resetPassword,
    signInWithGoogle,
    signInWithGitHub,
    signInWithTwitter,
    refreshUser,
    isAuthenticated: !!user,
    hasRole,
    canAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
