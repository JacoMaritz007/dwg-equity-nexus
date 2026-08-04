import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { InvestmentOfferingWithDetails, OfferingFilters, InvestmentFormData } from '@/types/investment';
import { useToast } from '@/hooks/use-toast';

export const useInvestmentOfferings = () => {
  const [offerings, setOfferings] = useState<InvestmentOfferingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOfferings = useCallback(async (filters?: OfferingFilters) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('investment_offerings')
        .select(`
          *,
          offering_documents(*),
          offering_milestones(*),
          offering_media(*)
        `);

      // Apply filters
      if (filters?.status) {
        if (filters.status === 'past') {
          query = query.in('status', ['closed', 'cancelled']);
        } else if (filters.status !== 'all') {
          query = query.eq('status', filters.status as any);
        }
      }

      if (filters?.type && filters.type !== 'all') {
        query = query.eq('investment_type', filters.type);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Apply sorting
      const sortBy = filters?.sortBy || 'created_at';
      const sortOrder = filters?.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, error } = await query;

      if (error) throw error;

      // Get investor counts for each offering
      const offeringsWithCounts = await Promise.all(
        (data || []).map(async (offering) => {
          const { count } = await supabase
            .from('user_investments')
            .select('*', { count: 'exact', head: true })
            .eq('offering_id', offering.id);

          return {
            ...offering,
            investor_count: count || 0
          };
        })
      );

      setOfferings(offeringsWithCounts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch offerings';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchOfferingById = useCallback(async (id: string): Promise<InvestmentOfferingWithDetails | null> => {
    try {
      const { data, error } = await supabase
        .from('investment_offerings')
        .select(`
          *,
          offering_documents(*),
          offering_milestones(*),
          offering_media(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      if (!data) return null;

      // Get investor count
      const { count } = await supabase
        .from('user_investments')
        .select('*', { count: 'exact', head: true })
        .eq('offering_id', id);

      return {
        ...data,
        investor_count: count || 0
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch offering';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  const createInvestment = useCallback(async (investmentData: InvestmentFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_investments')
        .insert({
          user_id: user.id,
          offering_id: investmentData.offering_id,
          investment_amount: investmentData.investment_amount,
          shares: investmentData.shares,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Investment created successfully",
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create investment';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  const getActiveOfferings = useCallback(() => {
    return offerings.filter(offering => offering.status === 'active');
  }, [offerings]);

  const getPastOfferings = useCallback(() => {
    return offerings.filter(offering => ['closed', 'cancelled'].includes(offering.status || ''));
  }, [offerings]);

  // Fetch offerings on mount
  useEffect(() => {
    fetchOfferings();
  }, [fetchOfferings]);

  return {
    offerings,
    loading,
    error,
    fetchOfferings,
    fetchOfferingById,
    createInvestment,
    getActiveOfferings,
    getPastOfferings,
    refetch: () => fetchOfferings(),
  };
};