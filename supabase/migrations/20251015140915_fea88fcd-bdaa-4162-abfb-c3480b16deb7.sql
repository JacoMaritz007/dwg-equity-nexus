-- Fix MISSING_RLS: Add admin SELECT policy to profiles table
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (is_admin(auth.uid()));

-- Fix STORAGE_EXPOSURE: Fix offering-documents storage policy to require verified investor status
DROP POLICY IF EXISTS "Users can view offering documents" ON storage.objects;

CREATE POLICY "Verified investors can view offering documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'offering-documents' AND (
    is_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND kyc_verified = true
      AND identity_verified = true  
      AND verification_status = 'approved'
    )
  )
);

-- Fix STORAGE_EXPOSURE: Add admin access to verification-documents bucket
DROP POLICY IF EXISTS "Users can view their own verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage verification documents in storage" ON storage.objects;

CREATE POLICY "Admins can manage verification documents in storage"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'verification-documents' AND
  is_admin(auth.uid())
);

CREATE POLICY "Users can upload their verification documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'verification-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own verification documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'verification-documents' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    is_admin(auth.uid())
  )
);