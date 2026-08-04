-- Fix security issue: Require authentication for investment offerings access
-- Remove the overly permissive policy that allows anonymous access
DROP POLICY IF EXISTS "Everyone can view active offerings" ON public.investment_offerings;

-- Create new policy that requires authentication for viewing offerings
CREATE POLICY "Authenticated users can view active offerings" 
ON public.investment_offerings 
FOR SELECT 
TO authenticated
USING (status = 'active'::investment_status OR is_admin(auth.uid()));

-- Admins policy remains the same for full management access
-- (This policy already exists, just confirming it's still in place)
-- CREATE POLICY "Admins can manage offerings" 
-- ON public.investment_offerings 
-- FOR ALL 
-- USING (is_admin(auth.uid()));