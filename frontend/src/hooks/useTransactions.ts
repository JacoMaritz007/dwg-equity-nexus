import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api-client';

interface Transaction {
  id: string;
  user_id: string;
  investment_id?: string;
  type: 'contribution' | 'distribution' | 'fee' | 'expense';
  amount: number;
  transaction_date: string;
  created_at: string;
  description?: string;
  reference_number?: string;
}

interface AccountSummary {
  cashAvailable: number;
  totalInvestments: number;
  pendingDistributions: number;
  recentCapitalCalls: number;
}

function mapTransaction(t: Record<string, unknown>): Transaction {
  return {
    id: t.id as string,
    user_id: t.userId as string,
    investment_id: t.investmentId as string | undefined,
    type: t.type as Transaction['type'],
    amount: Number(t.amount),
    transaction_date: t.transactionDate as string,
    created_at: t.createdAt as string,
    description: t.description as string | undefined,
    reference_number: t.referenceNumber as string | undefined,
  };
}

export const useTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accountSummary, setAccountSummary] = useState<AccountSummary>({
    cashAvailable: 0,
    totalInvestments: 0,
    pendingDistributions: 0,
    recentCapitalCalls: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchTransactions();
      fetchAccountSummary();
    }
  }, [user]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      // GET /transactions already scopes to "own rows, or admin sees all"
      // server-side (see backend/authz/policies.ts canViewTransaction).
      const raw = await api.get<Record<string, unknown>[]>('/transactions');
      const mapped = raw
        .map(mapTransaction)
        .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));
      setTransactions(mapped);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountSummary = async () => {
    try {
      const [investments, txRaw, drawsRaw] = await Promise.all([
        api.get<{ investmentAmount: string; status: string }[]>('/investments'),
        api.get<{ type: string; amount: string }[]>('/transactions'),
        api.get<{ amountDue: string; status: string }[]>('/capital-call-draws'),
      ]);

      // Cancelled pledges never became real commitments — excluding them
      // keeps this in line with the Capital Committed/Deployed split shown
      // on MyInvestmentsPage (useMyInvestments.ts).
      const totalInvestments = investments
        .filter((inv) => inv.status !== 'cancelled')
        .reduce((sum, inv) => sum + Number(inv.investmentAmount), 0);

      const contributions = txRaw
        .filter((t) => t.type === 'contribution')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const distributions = txRaw
        .filter((t) => t.type === 'distribution')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const pendingDistributions = 0; // Will be implemented with new schema

      // Was filtering transactions by type === 'fee' — unrelated to actual
      // capital calls, just a mislabeled stat. Real capital-call obligations
      // live in capital_call_draws (see backend/src/routes/capital-call-draws.ts).
      const capitalCalls = drawsRaw
        .filter((d) => d.status === 'due' || d.status === 'payment_submitted')
        .reduce((sum, d) => sum + Number(d.amountDue), 0);

      setAccountSummary({
        cashAvailable: contributions - totalInvestments + distributions,
        totalInvestments,
        pendingDistributions,
        recentCapitalCalls: capitalCalls
      });
    } catch (err) {
      console.error('Error fetching account summary:', err);
    }
  };

  // Admin-only on the backend (matches the original RLS: there was never a
  // user-facing INSERT policy for transactions, only "Admins can manage
  // transactions") — not currently called from anywhere in the app, same
  // as it was originally.
  const createTransaction = async (transactionData: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
    try {
      const data = await api.post('/transactions', {
        userId: user?.id,
        investmentId: transactionData.investment_id,
        type: transactionData.type,
        amount: String(transactionData.amount),
        description: transactionData.description,
        referenceNumber: transactionData.reference_number,
      });

      await fetchTransactions();
      await fetchAccountSummary();

      return data;
    } catch (err) {
      console.error('Error creating transaction:', err);
      throw err;
    }
  };

  const filterTransactions = (filters: {
    search?: string;
    type?: string;
    dateRange?: { start: string; end: string };
  }) => {
    return transactions.filter(transaction => {
      const matchesSearch = !filters.search ||
        transaction.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
        transaction.reference_number?.toLowerCase().includes(filters.search.toLowerCase());

      const matchesType = !filters.type || filters.type === 'all' ||
        transaction.type === filters.type;

      const matchesDate = !filters.dateRange || (
        new Date(transaction.transaction_date) >= new Date(filters.dateRange.start) &&
        new Date(transaction.transaction_date) <= new Date(filters.dateRange.end)
      );

      return matchesSearch && matchesType && matchesDate;
    });
  };

  return {
    transactions,
    accountSummary,
    loading,
    error,
    fetchTransactions,
    createTransaction,
    filterTransactions
  };
};
