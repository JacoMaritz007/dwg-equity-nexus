import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api-client';

interface VerificationStatus {
  identity_verified: boolean;
  address_verified: boolean;
  financial_verified: boolean;
  pep_screened: boolean;
  sanctions_screened: boolean;
  kyc_completed: boolean;
  is_accredited: boolean;
  investor_classification: string | null;
  verification_level: string | null;
  overall_progress: number;
  can_invest: boolean;
}

interface ProfileResponse {
  isAccredited: boolean | null;
  investorClassification: string | null;
  verificationLevel: string | null;
}

interface VerificationDocResponse {
  documentType: string;
  verificationStatus: string;
}

interface ScreeningDocResponse {
  screeningType: string;
  status: string;
}

export const useVerificationStatus = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVerificationStatus = async () => {
    if (!user) {
      setStatus(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [profile, documents, screeningDocs] = await Promise.all([
        api.get<ProfileResponse>(`/profiles/${user.id}`),
        api.get<VerificationDocResponse[]>('/verification-documents'),
        api.get<ScreeningDocResponse[]>('/compliance-screening'),
      ]);

      // Both list endpoints already scope to "own rows, or admin sees all"
      // server-side (see backend/authz/policies.ts) — filtering to
      // 'approved' here mirrors the original app's client-side filter.
      const approvedDocTypes = new Set(
        documents.filter((d) => d.verificationStatus === 'approved').map((d) => d.documentType),
      );
      const hasIdentityDoc =
        approvedDocTypes.has('passport') ||
        approvedDocTypes.has('national_id') ||
        approvedDocTypes.has('driving_license');
      const hasAddressDoc = approvedDocTypes.has('proof_of_address');
      const hasFinancialDoc =
        approvedDocTypes.has('bank_statement') ||
        approvedDocTypes.has('income_verification') ||
        approvedDocTypes.has('source_of_wealth');

      const approvedScreenings = new Set(
        screeningDocs.filter((d) => d.status === 'approved').map((d) => d.screeningType),
      );
      const pepScreened = approvedScreenings.has('pep');
      const sanctionsScreened = approvedScreenings.has('sanctions');

      const identity_verified = hasIdentityDoc;
      const address_verified = hasAddressDoc;
      const financial_verified = hasFinancialDoc;
      const kyc_completed = identity_verified && address_verified && financial_verified;
      const is_accredited = profile?.isAccredited || false;

      const verificationSteps = [
        identity_verified,
        address_verified,
        financial_verified,
        pepScreened,
        sanctionsScreened,
      ];

      const completedSteps = verificationSteps.filter(Boolean).length;
      const overall_progress = Math.round((completedSteps / verificationSteps.length) * 100);
      const can_invest = verificationSteps.every(Boolean);

      setStatus({
        identity_verified,
        address_verified,
        financial_verified,
        pep_screened: pepScreened,
        sanctions_screened: sanctionsScreened,
        kyc_completed,
        is_accredited,
        investor_classification: profile?.investorClassification ?? null,
        verification_level: profile?.verificationLevel ?? null,
        overall_progress,
        can_invest,
      });
    } catch (err) {
      console.error('Error fetching verification status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch verification status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerificationStatus();
  }, [user]);

  return {
    status,
    loading,
    error,
    refetch: fetchVerificationStatus
  };
};
