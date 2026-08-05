import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api-client';

export type DocStatus = 'verified' | 'pending' | 'rejected' | 'expired' | 'required';

interface VerificationStatus {
  identity_verified: boolean;
  address_verified: boolean;
  financial_verified: boolean;
  identity_status: DocStatus;
  address_status: DocStatus;
  financial_status: DocStatus;
  pep_screened: boolean;
  sanctions_screened: boolean;
  aml_questionnaire_completed: boolean;
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
  amlQuestionnaireCompletedAt: string | null;
}

interface VerificationDocResponse {
  documentType: string;
  verificationStatus: string;
}

interface ScreeningDocResponse {
  screeningType: string;
  status: string;
}

// Weighted so an uploaded-but-unreviewed document moves the progress bar
// immediately instead of only once an admin approves it — previously 'pending'
// docs contributed nothing, so the bar looked frozen right after upload.
const STATUS_WEIGHT: Record<DocStatus, number> = {
  verified: 1,
  pending: 0.5,
  rejected: 0,
  expired: 0,
  required: 0,
};

function categoryStatus(docs: VerificationDocResponse[], types: string[]): DocStatus {
  const relevant = docs.filter((d) => types.includes(d.documentType));
  if (relevant.some((d) => d.verificationStatus === 'approved')) return 'verified';
  if (relevant.some((d) => d.verificationStatus === 'pending' || d.verificationStatus === 'in_progress')) {
    return 'pending';
  }
  if (relevant.some((d) => d.verificationStatus === 'expired')) return 'expired';
  if (relevant.length > 0) return 'rejected';
  return 'required';
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
      // server-side (see backend/authz/policies.ts).
      const identity_status = categoryStatus(documents, ['passport', 'national_id', 'driving_license']);
      const address_status = categoryStatus(documents, ['proof_of_address']);
      const financial_status = categoryStatus(documents, [
        'bank_statement',
        'income_verification',
        'source_of_wealth',
      ]);

      const approvedScreenings = new Set(
        screeningDocs.filter((d) => d.status === 'approved').map((d) => d.screeningType),
      );
      const pepScreened = approvedScreenings.has('pep');
      const sanctionsScreened = approvedScreenings.has('sanctions');

      const identity_verified = identity_status === 'verified';
      const address_verified = address_status === 'verified';
      const financial_verified = financial_status === 'verified';
      const kyc_completed = identity_verified && address_verified && financial_verified;
      const is_accredited = profile?.isAccredited || false;
      const aml_questionnaire_completed = Boolean(profile?.amlQuestionnaireCompletedAt);

      // can_invest mirrors the server-side gate in backend/src/authz/policies.ts's
      // canInvest() exactly (same 5 flags) — the AML questionnaire itself isn't a
      // gate, it's how a client gets to pepScreened/sanctionsScreened in the first
      // place, so it isn't folded into this list.
      const verificationSteps = [
        identity_verified,
        address_verified,
        financial_verified,
        pepScreened,
        sanctionsScreened,
      ];
      const can_invest = verificationSteps.every(Boolean);

      const weightedProgress =
        STATUS_WEIGHT[identity_status] +
        STATUS_WEIGHT[address_status] +
        STATUS_WEIGHT[financial_status] +
        (pepScreened ? 1 : 0) +
        (sanctionsScreened ? 1 : 0);
      const overall_progress = Math.round((weightedProgress / verificationSteps.length) * 100);

      setStatus({
        identity_verified,
        address_verified,
        financial_verified,
        identity_status,
        address_status,
        financial_status,
        pep_screened: pepScreened,
        sanctions_screened: sanctionsScreened,
        aml_questionnaire_completed,
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
