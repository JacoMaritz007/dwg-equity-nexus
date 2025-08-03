-- Fix RLS policies to use subqueries for better performance
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own investments" ON public.user_investments;
DROP POLICY IF EXISTS "Users can create their own investments" ON public.user_investments;
DROP POLICY IF EXISTS "Users can update their own investments" ON public.user_investments;
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view public documents and their own" ON public.documents;
DROP POLICY IF EXISTS "Users can upload documents" ON public.documents;
DROP POLICY IF EXISTS "Everyone can view active offerings" ON public.investment_offerings;
DROP POLICY IF EXISTS "Admins can manage offerings" ON public.investment_offerings;
DROP POLICY IF EXISTS "Admins can manage transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can manage all documents" ON public.documents;
DROP POLICY IF EXISTS "Everyone can view updates for active offerings" ON public.investment_updates;
DROP POLICY IF EXISTS "Admins can manage updates" ON public.investment_updates;
DROP POLICY IF EXISTS "Investors can view capital calls for their investments" ON public.capital_calls;
DROP POLICY IF EXISTS "Admins can manage capital calls" ON public.capital_calls;

-- Recreate policies with subqueries for better performance
-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.is_admin((SELECT auth.uid())));

-- RLS Policies for investment_offerings
CREATE POLICY "Everyone can view active offerings"
  ON public.investment_offerings FOR SELECT
  USING (status = 'active' OR public.is_admin((SELECT auth.uid())));

CREATE POLICY "Admins can manage offerings"
  ON public.investment_offerings FOR ALL
  USING (public.is_admin((SELECT auth.uid())));

-- RLS Policies for user_investments
CREATE POLICY "Users can view their own investments"
  ON public.user_investments FOR SELECT
  USING ((SELECT auth.uid()) = user_id OR public.is_admin((SELECT auth.uid())));

CREATE POLICY "Users can create their own investments"
  ON public.user_investments FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own investments"
  ON public.user_investments FOR UPDATE
  USING ((SELECT auth.uid()) = user_id OR public.is_admin((SELECT auth.uid())));

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING ((SELECT auth.uid()) = user_id OR public.is_admin((SELECT auth.uid())));

CREATE POLICY "Admins can manage transactions"
  ON public.transactions FOR ALL
  USING (public.is_admin((SELECT auth.uid())));

-- RLS Policies for documents
CREATE POLICY "Users can view public documents and their own"
  ON public.documents FOR SELECT
  USING (is_public = true OR (SELECT auth.uid()) = user_id OR public.is_admin((SELECT auth.uid())));

CREATE POLICY "Users can upload documents"
  ON public.documents FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = uploaded_by);

CREATE POLICY "Admins can manage all documents"
  ON public.documents FOR ALL
  USING (public.is_admin((SELECT auth.uid())));

-- RLS Policies for investment_updates
CREATE POLICY "Everyone can view updates for active offerings"
  ON public.investment_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.investment_offerings 
      WHERE id = offering_id AND status = 'active'
    ) OR public.is_admin((SELECT auth.uid()))
  );

CREATE POLICY "Admins can manage updates"
  ON public.investment_updates FOR ALL
  USING (public.is_admin((SELECT auth.uid())));

-- RLS Policies for capital_calls
CREATE POLICY "Investors can view capital calls for their investments"
  ON public.capital_calls FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_investments 
      WHERE user_id = (SELECT auth.uid()) AND offering_id = capital_calls.offering_id
    ) OR public.is_admin((SELECT auth.uid()))
  );

CREATE POLICY "Admins can manage capital calls"
  ON public.capital_calls FOR ALL
  USING (public.is_admin((SELECT auth.uid())));