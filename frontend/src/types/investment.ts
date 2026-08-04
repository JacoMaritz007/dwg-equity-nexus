// Plain TS types, field names kept snake_case to match every existing
// consumer component (CreateOfferingForm, OfferingDetailsPage, MediaPreview,
// InvestmentProcessModal, OfferingsManagement — none of which are migrated
// off Supabase yet; see frontend/README.md). Replaces the old dependency on
// Supabase-generated `Database['public']['Tables'][...]` types, which no
// longer have a source, without changing the shape those files expect.
//
// The backend API itself returns camelCase (idiomatic for a fresh Drizzle
// schema — see backend/src/db/schema.ts). Hooks that call the new API
// (useUserProfile.ts, useInvestmentOfferings.ts) convert camelCase →
// snake_case at their own boundary so this shared type file — and every
// component still depending on it — doesn't have to change out from under
// them piecemeal.

export interface InvestmentOffering {
  id: string;
  title: string;
  description: string | null;
  target_amount: number;
  raised_amount: number | null;
  minimum_investment: number;
  maximum_investment: number | null;
  investment_type: string;
  location: string | null;
  expected_return: string | null;
  investment_term: string | null;
  status: 'draft' | 'active' | 'closed' | 'cancelled' | null;
  closing_date: string | null;
  image_url: string | null;
  created_by: string;
  lister_name: string | null;
  product_name: string | null;
  address: string | null;
  targeted_irr: number | null;
  targeted_avg_coc: number | null;
  distribution_overview: string | null;
  tax_fee_adjusted_irr: number | null;
  tax_fee_adjusted_coc: number | null;
  tax_adjusted_em: number | null;
  tax_adjusted_cg: number | null;
  coc_year_1: number | null;
  coc_year_2: number | null;
  coc_year_3: number | null;
  coc_year_4: number | null;
  coc_year_5: number | null;
  coc_year_6: number | null;
  coc_year_7: number | null;
  base_fee: number | null;
  structure_fee: number | null;
  marketing_sales_fee: number | null;
  success_fee: number | null;
  capital_gain_success_fee: number | null;
  disregard_user_levels: boolean | null;
  published_wealth_migrate: boolean | null;
  published_private_wealth: boolean | null;
  other_published: boolean | null;
  enable_source_wealth_screen: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface OfferingDocument {
  id: string;
  offering_id: string;
  document_category: string;
  title: string;
  description: string | null;
  file_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  is_required: boolean | null;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface OfferingMilestone {
  id: string;
  offering_id: string;
  description: string;
  milestone_date: string;
  milestone_order: number;
  created_at: string;
  updated_at: string;
}

export interface OfferingMedia {
  id: string;
  offering_id: string;
  media_type: string;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  url: string | null;
  display_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface UserInvestment {
  id: string;
  user_id: string;
  offering_id: string;
  investment_amount: number;
  shares: number | null;
  investment_date: string;
  status: string | null;
  created_at: string;
  updated_at: string;
}

// Extended types for UI
export interface InvestmentOfferingWithDetails extends InvestmentOffering {
  offering_documents?: OfferingDocument[];
  offering_milestones?: OfferingMilestone[];
  offering_media?: OfferingMedia[];
  investor_count?: number;
}

// Frontend display types
export interface OfferingDisplayData {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  image: string;
  offeringSize: string;
  minInvestment: string;
  targetReturn: string;
  term: string;
  status: 'active' | 'past' | 'coming-soon';
  raisedAmount: number;
  raisedPercentage: number;
  closingDate: string;
  highlights: string[];
  description?: string;
  location?: string;
  documents?: OfferingDocument[];
  milestones?: OfferingMilestone[];
  media?: OfferingMedia[];
}

// Investment form data
export interface InvestmentFormData {
  offering_id: string;
  investment_amount: number;
  shares?: number;
}

// Search and filter types
export interface OfferingFilters {
  search?: string;
  type?: string;
  status?: string;
  sortBy?: 'closing_date' | 'target_amount' | 'minimum_investment' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}
