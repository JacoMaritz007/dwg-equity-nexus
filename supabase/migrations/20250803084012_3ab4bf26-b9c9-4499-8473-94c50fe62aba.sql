-- Create enums for verification system
CREATE TYPE verification_status AS ENUM ('pending', 'in_progress', 'approved', 'rejected', 'expired');
CREATE TYPE investor_classification AS ENUM ('retail', 'sophisticated', 'high_net_worth', 'institutional');
CREATE TYPE risk_rating AS ENUM ('low', 'medium', 'high');
CREATE TYPE document_type AS ENUM (
  'passport', 'national_id', 'driving_license', 'proof_of_address', 
  'bank_statement', 'income_verification', 'source_of_wealth', 
  'pep_declaration', 'sophisticated_investor_cert', 'professional_qualification'
);
CREATE TYPE source_of_wealth AS ENUM (
  'employment', 'business_ownership', 'inheritance', 'property_sale', 
  'investment_gains', 'pension', 'gift', 'other'
);

-- Create verification_documents table
CREATE TABLE public.verification_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_type document_type NOT NULL,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  verification_status verification_status DEFAULT 'pending',
  reviewer_id UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewer_notes TEXT,
  expiry_date DATE,
  is_expired BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create verification_history table
CREATE TABLE public.verification_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_id UUID,
  previous_status verification_status,
  new_status verification_status NOT NULL,
  changed_by UUID NOT NULL,
  change_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhance profiles table with verification fields
ALTER TABLE public.profiles ADD COLUMN verification_status verification_status DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN investor_classification investor_classification DEFAULT 'retail';
ALTER TABLE public.profiles ADD COLUMN risk_rating risk_rating DEFAULT 'low';
ALTER TABLE public.profiles ADD COLUMN source_of_wealth source_of_wealth[];
ALTER TABLE public.profiles ADD COLUMN annual_income NUMERIC;
ALTER TABLE public.profiles ADD COLUMN net_worth NUMERIC;
ALTER TABLE public.profiles ADD COLUMN is_pep BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN pep_details TEXT;
ALTER TABLE public.profiles ADD COLUMN pep_screening_date DATE;
ALTER TABLE public.profiles ADD COLUMN sanctions_screening_date DATE;
ALTER TABLE public.profiles ADD COLUMN sanctions_clear BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN verification_completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN next_review_date DATE;
ALTER TABLE public.profiles ADD COLUMN compliance_notes TEXT;
ALTER TABLE public.profiles ADD COLUMN nationality TEXT;
ALTER TABLE public.profiles ADD COLUMN place_of_birth TEXT;
ALTER TABLE public.profiles ADD COLUMN occupation TEXT;
ALTER TABLE public.profiles ADD COLUMN employer TEXT;

-- Enable RLS on new tables
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for verification_documents
CREATE POLICY "Users can view their own verification documents" 
ON public.verification_documents 
FOR SELECT 
USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Users can upload their own verification documents" 
ON public.verification_documents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own verification documents" 
ON public.verification_documents 
FOR UPDATE 
USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage all verification documents" 
ON public.verification_documents 
FOR ALL 
USING (is_admin(auth.uid()));

-- RLS policies for verification_history
CREATE POLICY "Users can view their own verification history" 
ON public.verification_history 
FOR SELECT 
USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage verification history" 
ON public.verification_history 
FOR ALL 
USING (is_admin(auth.uid()));

-- Create function to update document expiry status
CREATE OR REPLACE FUNCTION update_document_expiry_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expiry_date IS NOT NULL AND NEW.expiry_date <= CURRENT_DATE THEN
    NEW.is_expired = TRUE;
    NEW.verification_status = 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for document expiry
CREATE TRIGGER check_document_expiry
  BEFORE UPDATE ON public.verification_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_document_expiry_status();

-- Create function to log verification status changes
CREATE OR REPLACE FUNCTION log_verification_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.verification_status IS DISTINCT FROM NEW.verification_status THEN
    INSERT INTO public.verification_history (
      user_id, document_id, previous_status, new_status, changed_by, change_reason
    ) VALUES (
      NEW.user_id, NEW.id, OLD.verification_status, NEW.verification_status, 
      COALESCE(NEW.reviewer_id, auth.uid()), 'Status updated'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for verification history logging
CREATE TRIGGER log_verification_status_change
  AFTER UPDATE ON public.verification_documents
  FOR EACH ROW
  EXECUTE FUNCTION log_verification_change();

-- Update timestamp trigger for verification_documents
CREATE TRIGGER update_verification_documents_updated_at
  BEFORE UPDATE ON public.verification_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();