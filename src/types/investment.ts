import { Database } from '@/integrations/supabase/types';

// Database types
export type InvestmentOffering = Database['public']['Tables']['investment_offerings']['Row'];
export type InvestmentOfferingInsert = Database['public']['Tables']['investment_offerings']['Insert'];
export type InvestmentOfferingUpdate = Database['public']['Tables']['investment_offerings']['Update'];

export type OfferingDocument = Database['public']['Tables']['offering_documents']['Row'];
export type OfferingMilestone = Database['public']['Tables']['offering_milestones']['Row'];
export type OfferingMedia = Database['public']['Tables']['offering_media']['Row'];
export type UserInvestment = Database['public']['Tables']['user_investments']['Row'];

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