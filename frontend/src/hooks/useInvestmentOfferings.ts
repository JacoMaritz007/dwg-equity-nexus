import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api-client';
import {
  InvestmentOffering,
  InvestmentOfferingWithDetails,
  OfferingFilters,
  InvestmentFormData,
  OfferingMilestone,
  OfferingMedia,
  OfferingDocument,
} from '@/types/investment';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// The backend returns camelCase (idiomatic Drizzle output — see
// backend/src/db/schema.ts) with numeric columns as strings. This hook is
// the boundary that converts that into the snake_case/number shape every
// consumer component (CreateOfferingForm, OfferingDetailsPage, etc.) still
// expects, so none of them need to change until their own migration pass.
function mapOffering(o: Record<string, unknown>): InvestmentOffering {
  const num = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));
  return {
    id: o.id as string,
    title: o.title as string,
    description: (o.description as string) ?? null,
    target_amount: Number(o.targetAmount),
    raised_amount: num(o.raisedAmount),
    minimum_investment: Number(o.minimumInvestment),
    maximum_investment: num(o.maximumInvestment),
    investment_type: o.investmentType as string,
    location: (o.location as string) ?? null,
    expected_return: (o.expectedReturn as string) ?? null,
    investment_term: (o.investmentTerm as string) ?? null,
    status: (o.status as InvestmentOffering['status']) ?? null,
    closing_date: (o.closingDate as string) ?? null,
    image_url: (o.imageUrl as string) ?? null,
    created_by: o.createdBy as string,
    lister_name: (o.listerName as string) ?? null,
    product_name: (o.productName as string) ?? null,
    address: (o.address as string) ?? null,
    targeted_irr: num(o.targetedIrr),
    targeted_avg_coc: num(o.targetedAvgCoc),
    distribution_overview: (o.distributionOverview as string) ?? null,
    tax_fee_adjusted_irr: num(o.taxFeeAdjustedIrr),
    tax_fee_adjusted_coc: num(o.taxFeeAdjustedCoc),
    tax_adjusted_em: num(o.taxAdjustedEm),
    tax_adjusted_cg: num(o.taxAdjustedCg),
    coc_year_1: num(o.cocYear1),
    coc_year_2: num(o.cocYear2),
    coc_year_3: num(o.cocYear3),
    coc_year_4: num(o.cocYear4),
    coc_year_5: num(o.cocYear5),
    coc_year_6: num(o.cocYear6),
    coc_year_7: num(o.cocYear7),
    base_fee: num(o.baseFee),
    structure_fee: num(o.structureFee),
    marketing_sales_fee: num(o.marketingSalesFee),
    success_fee: num(o.successFee),
    capital_gain_success_fee: num(o.capitalGainSuccessFee),
    disregard_user_levels: (o.disregardUserLevels as boolean) ?? null,
    published_wealth_migrate: (o.publishedWealthMigrate as boolean) ?? null,
    published_private_wealth: (o.publishedPrivateWealth as boolean) ?? null,
    other_published: (o.otherPublished as boolean) ?? null,
    enable_source_wealth_screen: (o.enableSourceWealthScreen as boolean) ?? null,
    created_at: o.createdAt as string,
    updated_at: o.updatedAt as string,
  };
}

function mapMilestone(m: Record<string, unknown>): OfferingMilestone {
  return {
    id: m.id as string,
    offering_id: m.offeringId as string,
    description: m.description as string,
    milestone_date: m.milestoneDate as string,
    milestone_order: m.milestoneOrder as number,
    created_at: m.createdAt as string,
    updated_at: m.updatedAt as string,
  };
}

function mapMedia(m: Record<string, unknown>): OfferingMedia {
  return {
    id: m.id as string,
    offering_id: m.offeringId as string,
    media_type: m.mediaType as string,
    file_path: (m.filePath as string) ?? null,
    file_name: (m.fileName as string) ?? null,
    file_size: (m.fileSize as number) ?? null,
    mime_type: (m.mimeType as string) ?? null,
    url: (m.url as string) ?? null,
    display_order: (m.displayOrder as number) ?? null,
    created_at: m.createdAt as string,
    updated_at: m.updatedAt as string,
  };
}

function mapDocument(d: Record<string, unknown>): OfferingDocument {
  return {
    id: d.id as string,
    offering_id: d.offeringId as string,
    document_category: d.documentCategory as string,
    title: d.title as string,
    description: (d.description as string) ?? null,
    file_path: d.filePath as string,
    file_name: d.fileName as string,
    file_size: (d.fileSize as number) ?? null,
    mime_type: (d.mimeType as string) ?? null,
    is_required: (d.isRequired as boolean) ?? null,
    uploaded_by: d.uploadedBy as string,
    created_at: d.createdAt as string,
    updated_at: d.updatedAt as string,
  };
}

export const useInvestmentOfferings = () => {
  const [offerings, setOfferings] = useState<InvestmentOfferingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Filtering/sorting happens client-side against the full list the API
  // returns (the API itself just returns everything the actor is allowed to
  // see — see backend authz/policies.ts canViewOffering). Fine at this
  // scale; push to query params on the backend if the offerings list grows
  // large enough for that to matter.
  const fetchOfferings = useCallback(async (filters?: OfferingFilters) => {
    try {
      setLoading(true);
      setError(null);

      const raw = await api.get<Record<string, unknown>[]>('/offerings');
      let data: InvestmentOfferingWithDetails[] = raw.map((o) => ({
        ...mapOffering(o),
        offering_media: ((o.offeringMedia as Record<string, unknown>[]) ?? []).map(mapMedia),
      }));

      if (filters?.status) {
        if (filters.status === 'past') {
          data = data.filter((o) => o.status === 'closed' || o.status === 'cancelled');
        } else if (filters.status !== 'all') {
          data = data.filter((o) => o.status === filters.status);
        }
      }
      if (filters?.type && filters.type !== 'all') {
        data = data.filter((o) => o.investment_type === filters.type);
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        data = data.filter(
          (o) =>
            o.title.toLowerCase().includes(q) || (o.description?.toLowerCase().includes(q) ?? false),
        );
      }

      const sortBy = filters?.sortBy ?? 'created_at';
      const sortOrder = filters?.sortOrder ?? 'desc';
      data = [...data].sort((a, b) => {
        const av = a[sortBy] ?? '';
        const bv = b[sortBy] ?? '';
        const cmp = String(av).localeCompare(String(bv));
        return sortOrder === 'asc' ? cmp : -cmp;
      });

      setOfferings(data);
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
      const [offeringRaw, milestonesRaw, mediaRaw] = await Promise.all([
        api.get<Record<string, unknown>>(`/offerings/${id}`),
        api.get<Record<string, unknown>[]>(`/offerings/${id}/milestones`).catch(() => []),
        api.get<Record<string, unknown>[]>(`/offerings/${id}/media`).catch(() => []),
      ]);
      // offering-documents requires full investor verification, so it can
      // 403 for a browsing/unverified user — that's expected, not an error.
      const documentsRaw = await api
        .get<Record<string, unknown>[]>(`/offerings/${id}/documents`)
        .catch(() => []);

      return {
        ...mapOffering(offeringRaw),
        offering_milestones: milestonesRaw.map(mapMilestone),
        offering_media: mediaRaw.map(mapMedia),
        offering_documents: documentsRaw.map(mapDocument),
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
    if (!user) throw new Error('User not authenticated');
    try {
      const data = await api.post('/investments', {
        userId: user.id,
        offeringId: investmentData.offering_id,
        investmentAmount: String(investmentData.investment_amount),
        shares: investmentData.shares !== undefined ? String(investmentData.shares) : undefined,
      });

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
  }, [toast, user]);

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
