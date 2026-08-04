import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api-client';

// Field names are camelCase now (matches the API's JSON responses directly,
// which come straight from Drizzle) — the old snake_case shape was just
// Postgres's column naming leaking through the Supabase client.
interface UserProfile {
  id: string;
  kycVerified: boolean | null;
  identityVerified: boolean | null;
  addressVerified: boolean | null;
  financialVerified: boolean | null;
  isAccredited: boolean | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  annualIncome?: string | null;
  netWorth?: string | null;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<UserProfile>(`/profiles/${user.id}`);
      setProfile(data);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user, fetchProfile]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('Not authenticated');
    try {
      setError(null);
      const data = await api.patch<UserProfile>(`/profiles/${user.id}`, updates);
      setProfile(data);
      return data;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    }
  };

  const isVerified = Boolean(profile?.kycVerified && profile?.identityVerified);
  const canInvest = isVerified && Boolean(profile?.isAccredited);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    isVerified,
    canInvest
  };
};
