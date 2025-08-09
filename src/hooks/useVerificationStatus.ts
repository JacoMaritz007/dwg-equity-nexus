import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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

      // Fetch user profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          kyc_verified,
          is_accredited,
          investor_classification,
          verification_level,
          identity_verified,
          address_verified,
          financial_verified,
          pep_screened,
          sanctions_screened
        `)
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Fetch approved verification documents count
      const { data: documents, error: docsError } = await supabase
        .from('verification_documents')
        .select('document_type')
        .eq('user_id', user.id)
        .eq('verification_status', 'approved');

      if (docsError) throw docsError;

      // Check which document types are approved
      const approvedDocTypes = new Set(documents?.map(doc => doc.document_type) || []);
      const hasIdentityDoc = approvedDocTypes.has('passport') || 
                            approvedDocTypes.has('national_id') || 
                            approvedDocTypes.has('driving_license');
      const hasAddressDoc = approvedDocTypes.has('proof_of_address');
      const hasFinancialDoc = approvedDocTypes.has('bank_statement') || 
                             approvedDocTypes.has('income_verification') || 
                             approvedDocTypes.has('source_of_wealth');

      // Fetch compliance screening documents
      const { data: screeningDocs, error: screeningError } = await supabase
        .from('compliance_screening_documents')
        .select('screening_type')
        .eq('user_id', user.id)
        .eq('status', 'approved');

      if (screeningError) throw screeningError;

      const approvedScreenings = new Set(screeningDocs?.map(doc => doc.screening_type) || []);
      const pepScreened = approvedScreenings.has('pep');
      const sanctionsScreened = approvedScreenings.has('sanctions');

      // Calculate verification status
      const identity_verified = hasIdentityDoc;
      const address_verified = hasAddressDoc;
      const financial_verified = hasFinancialDoc;
      const kyc_completed = identity_verified && address_verified && financial_verified;
      const is_accredited = profile?.is_accredited || false;

      // Calculate overall progress (5 steps total)
      const verificationSteps = [
        identity_verified,
        address_verified,
        financial_verified,
        pepScreened,
        sanctionsScreened
      ];
      
      const completedSteps = verificationSteps.filter(Boolean).length;
      const overall_progress = Math.round((completedSteps / verificationSteps.length) * 100);

      // User can invest if all verifications are complete
      const can_invest = verificationSteps.every(Boolean);

      const verificationStatus: VerificationStatus = {
        identity_verified,
        address_verified,
        financial_verified,
        pep_screened: pepScreened,
        sanctions_screened: sanctionsScreened,
        kyc_completed,
        is_accredited,
        investor_classification: profile?.investor_classification,
        verification_level: profile?.verification_level,
        overall_progress,
        can_invest
      };

      setStatus(verificationStatus);
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