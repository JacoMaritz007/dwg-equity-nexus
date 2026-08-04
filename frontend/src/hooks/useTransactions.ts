import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountSummary = async () => {
    try {
      // Fetch user investments
      const { data: investments } = await supabase
        .from('user_investments')
        .select('investment_amount')
        .eq('user_id', user?.id);

      // Fetch transactions for calculations
      const { data: transactionData } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('user_id', user?.id);

      const totalInvestments = investments?.reduce((sum, inv) => sum + Number(inv.investment_amount), 0) || 0;
      
      const contributions = transactionData?.filter(t => t.type === 'contribution')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      const distributions = transactionData?.filter(t => t.type === 'distribution')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      const pendingDistributions = 0; // Will be implemented with new schema
      
      const capitalCalls = transactionData?.filter(t => t.type === 'fee')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

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

  const createTransaction = async (transactionData: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          amount: transactionData.amount,
          type: transactionData.type as 'contribution' | 'distribution' | 'fee' | 'expense',
          description: transactionData.description,
          reference_number: transactionData.reference_number,
          user_id: user?.id,
          investment_id: transactionData.investment_id
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh data
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