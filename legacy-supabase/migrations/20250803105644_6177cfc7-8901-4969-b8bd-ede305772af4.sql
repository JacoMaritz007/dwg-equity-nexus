-- Add RLS policies for verification_documents table
CREATE POLICY "Users can view their own verification documents" 
ON public.verification_documents 
FOR SELECT 
USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Users can insert their own verification documents" 
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

-- Add RLS policies for verification_history table
CREATE POLICY "Users can view their own verification history" 
ON public.verification_history 
FOR SELECT 
USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage verification history" 
ON public.verification_history 
FOR ALL 
USING (is_admin(auth.uid()));