-- Fix security issue: Restrict offering documents to verified investors only
-- Remove the overly permissive policy that allows all authenticated users access
DROP POLICY IF EXISTS "Everyone can view documents for active offerings" ON public.offering_documents;

-- Create new policy that requires verification for viewing offering documents
CREATE POLICY "Verified investors can view documents for active offerings" 
ON public.offering_documents 
FOR SELECT 
TO authenticated
USING (
  -- Admin access
  is_admin(auth.uid()) 
  OR 
  -- Verified investors can access documents for active offerings
  (
    EXISTS (
      SELECT 1 FROM public.investment_offerings 
      WHERE investment_offerings.id = offering_documents.offering_id 
      AND investment_offerings.status = 'active'::investment_status
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.kyc_verified = true 
      AND profiles.identity_verified = true
      AND profiles.verification_status = 'approved'::verification_status
    )
  )
);