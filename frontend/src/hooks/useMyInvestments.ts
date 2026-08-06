import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api-client';
import type { PledgeInvestment } from '@/hooks/usePledgeDraft';

export interface MyInvestmentDraw {
  id: string;
  capitalCallId: string;
  investmentId: string;
  amountDue: string;
  amountPaid: string | null;
  status: string;
  paymentReference: string | null;
}

interface OfferingSummary {
  id: string;
  title: string;
}

export interface MyInvestmentRow extends PledgeInvestment {
  offeringTitle: string;
}

// Own-rows-only fetches, same ownership-filtered pattern as
// useTransactions.ts — GET /investments and GET /capital-call-draws already
// scope to "own rows, or admin sees all" server-side.
export const useMyInvestments = () => {
  const { user } = useAuth();
  const [investments, setInvestments] = useState<MyInvestmentRow[]>([]);
  const [draws, setDraws] = useState<MyInvestmentDraw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setInvestments([]);
      setDraws([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [rawInvestments, rawDraws, offerings] = await Promise.all([
        api.get<PledgeInvestment[]>('/investments'),
        api.get<MyInvestmentDraw[]>('/capital-call-draws'),
        api.get<OfferingSummary[]>('/offerings'),
      ]);
      const offeringById = new Map(offerings.map((o) => [o.id, o.title]));
      setInvestments(
        rawInvestments
          .filter((inv) => inv.userId === user.id)
          .map((inv) => ({ ...inv, offeringTitle: offeringById.get(inv.offeringId) ?? 'Unknown offering' })),
      );
      setDraws(rawDraws);
    } catch (err) {
      console.error('Error fetching investments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch investments');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const deployed = investments.filter((inv) => inv.status === 'fully_called' || inv.status === 'partially_called');
  const committed = investments.filter((inv) => inv.status === 'pending_signature' || inv.status === 'pledged');

  const capitalDeployed = draws
    .filter((d) => d.status === 'confirmed')
    .reduce((sum, d) => sum + Number(d.amountPaid ?? 0), 0);
  const capitalCommitted = committed.reduce((sum, inv) => sum + Number(inv.investmentAmount), 0);
  const pendingCallsCount = draws.filter((d) => d.status === 'due' || d.status === 'payment_submitted').length;

  return {
    investments,
    draws,
    deployed,
    committed,
    capitalDeployed,
    capitalCommitted,
    pendingCallsCount,
    loading,
    error,
    refetch: fetchAll,
  };
};
