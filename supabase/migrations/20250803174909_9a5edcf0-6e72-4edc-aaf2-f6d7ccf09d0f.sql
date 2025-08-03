-- Add foreign key constraint from verification_documents.user_id to profiles.id
-- This will enable PostgREST's automatic relationship detection for the admin interface

ALTER TABLE public.verification_documents 
ADD CONSTRAINT verification_documents_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;