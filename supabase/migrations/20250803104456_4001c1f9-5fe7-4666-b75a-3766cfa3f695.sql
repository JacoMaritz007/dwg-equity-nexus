-- Create verification-documents storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('verification-documents', 'verification-documents', false);

-- Create RLS policies for verification documents bucket
CREATE POLICY "Users can view their own verification documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'verification-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own verification documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'verification-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own verification documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'verification-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own verification documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'verification-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can manage all verification documents" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'verification-documents' AND is_admin(auth.uid()));