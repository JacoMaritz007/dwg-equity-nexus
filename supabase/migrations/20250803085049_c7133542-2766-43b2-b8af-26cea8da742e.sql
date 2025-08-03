-- Add missing verification columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS identity_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS address_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS financial_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS pep_screened boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sanctions_screened boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_level text DEFAULT 'basic';

-- Update existing data based on current verification status
UPDATE public.profiles SET 
  identity_verified = (verification_status = 'approved'),
  address_verified = (verification_status = 'approved'),
  financial_verified = (verification_status = 'approved' AND is_accredited = true),
  pep_screened = (pep_screening_date IS NOT NULL),
  sanctions_screened = (sanctions_screening_date IS NOT NULL),
  verification_level = CASE 
    WHEN investor_classification = 'high_net_worth' THEN 'enhanced'
    WHEN investor_classification = 'sophisticated' THEN 'enhanced'
    ELSE 'basic'
  END;