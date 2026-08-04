-- Add new columns to investment_offerings table for enhanced deal creation
ALTER TABLE public.investment_offerings 
ADD COLUMN lister_name TEXT,
ADD COLUMN product_name TEXT,
ADD COLUMN address TEXT,
ADD COLUMN targeted_irr DECIMAL,
ADD COLUMN targeted_avg_coc DECIMAL,
ADD COLUMN distribution_overview TEXT,
ADD COLUMN tax_fee_adjusted_irr DECIMAL,
ADD COLUMN tax_fee_adjusted_coc DECIMAL,
ADD COLUMN tax_adjusted_em DECIMAL,
ADD COLUMN tax_adjusted_cg DECIMAL,
ADD COLUMN coc_year_1 DECIMAL,
ADD COLUMN coc_year_2 DECIMAL,
ADD COLUMN coc_year_3 DECIMAL,
ADD COLUMN coc_year_4 DECIMAL,
ADD COLUMN coc_year_5 DECIMAL,
ADD COLUMN coc_year_6 DECIMAL,
ADD COLUMN coc_year_7 DECIMAL,
ADD COLUMN base_fee DECIMAL,
ADD COLUMN structure_fee DECIMAL,
ADD COLUMN marketing_sales_fee DECIMAL,
ADD COLUMN success_fee DECIMAL,
ADD COLUMN capital_gain_success_fee DECIMAL,
ADD COLUMN disregard_user_levels BOOLEAN DEFAULT FALSE,
ADD COLUMN published_wealth_migrate BOOLEAN DEFAULT FALSE,
ADD COLUMN published_private_wealth BOOLEAN DEFAULT FALSE,
ADD COLUMN other_published BOOLEAN DEFAULT FALSE,
ADD COLUMN enable_source_wealth_screen BOOLEAN DEFAULT FALSE;

-- Create offering_milestones table
CREATE TABLE public.offering_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offering_id UUID NOT NULL REFERENCES public.investment_offerings(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  milestone_date DATE NOT NULL,
  milestone_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for offering_milestones
ALTER TABLE public.offering_milestones ENABLE ROW LEVEL SECURITY;

-- Create policies for offering_milestones
CREATE POLICY "Everyone can view milestones for active offerings"
ON public.offering_milestones
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.investment_offerings
    WHERE investment_offerings.id = offering_milestones.offering_id
    AND investment_offerings.status = 'active'
  ) OR is_admin(auth.uid())
);

CREATE POLICY "Admins can manage milestones"
ON public.offering_milestones
FOR ALL
USING (is_admin(auth.uid()));

-- Create offering_media table
CREATE TABLE public.offering_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offering_id UUID NOT NULL REFERENCES public.investment_offerings(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('lister_logo', 'sponsor_logo', 'dd_provider_logo', 'featured_image', 'gallery_image', 'video_link')),
  file_path TEXT,
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT,
  url TEXT, -- For video links
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for offering_media
ALTER TABLE public.offering_media ENABLE ROW LEVEL SECURITY;

-- Create policies for offering_media
CREATE POLICY "Everyone can view media for active offerings"
ON public.offering_media
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.investment_offerings
    WHERE investment_offerings.id = offering_media.offering_id
    AND investment_offerings.status = 'active'
  ) OR is_admin(auth.uid())
);

CREATE POLICY "Admins can manage media"
ON public.offering_media
FOR ALL
USING (is_admin(auth.uid()));

-- Create offering_documents table (enhanced version of existing documents table for offerings)
CREATE TABLE public.offering_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offering_id UUID NOT NULL REFERENCES public.investment_offerings(id) ON DELETE CASCADE,
  document_category TEXT NOT NULL CHECK (document_category IN ('investment_memorandum', 'legal_structure', 'due_diligence', 'financial_model', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  is_required BOOLEAN DEFAULT FALSE,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for offering_documents
ALTER TABLE public.offering_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for offering_documents
CREATE POLICY "Everyone can view documents for active offerings"
ON public.offering_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.investment_offerings
    WHERE investment_offerings.id = offering_documents.offering_id
    AND investment_offerings.status = 'active'
  ) OR is_admin(auth.uid())
);

CREATE POLICY "Admins can manage offering documents"
ON public.offering_documents
FOR ALL
USING (is_admin(auth.uid()));

-- Create storage buckets for media and documents
INSERT INTO storage.buckets (id, name, public) VALUES ('offering-media', 'offering-media', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('offering-documents', 'offering-documents', false);

-- Create storage policies for offering-media bucket
CREATE POLICY "Anyone can view offering media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'offering-media');

CREATE POLICY "Admins can upload offering media"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'offering-media' AND is_admin(auth.uid()));

CREATE POLICY "Admins can update offering media"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'offering-media' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete offering media"
ON storage.objects
FOR DELETE
USING (bucket_id = 'offering-media' AND is_admin(auth.uid()));

-- Create storage policies for offering-documents bucket
CREATE POLICY "Users can view offering documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'offering-documents');

CREATE POLICY "Admins can upload offering documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'offering-documents' AND is_admin(auth.uid()));

CREATE POLICY "Admins can update offering documents"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'offering-documents' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete offering documents"
ON storage.objects
FOR DELETE
USING (bucket_id = 'offering-documents' AND is_admin(auth.uid()));

-- Add triggers for updated_at columns
CREATE TRIGGER update_offering_milestones_updated_at
BEFORE UPDATE ON public.offering_milestones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offering_media_updated_at
BEFORE UPDATE ON public.offering_media
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offering_documents_updated_at
BEFORE UPDATE ON public.offering_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();