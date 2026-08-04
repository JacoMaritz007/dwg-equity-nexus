-- Create enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'investor', 'manager');
CREATE TYPE public.investment_status AS ENUM ('draft', 'active', 'closed', 'cancelled');
CREATE TYPE public.transaction_type AS ENUM ('contribution', 'distribution', 'fee', 'expense');
CREATE TYPE public.document_type AS ENUM ('offering_document', 'legal_agreement', 'financial_report', 'tax_document', 'update');
CREATE TYPE public.capital_call_status AS ENUM ('pending', 'completed', 'overdue');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'US',
  date_of_birth DATE,
  is_accredited BOOLEAN DEFAULT FALSE,
  kyc_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create user roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create investment offerings table
CREATE TABLE public.investment_offerings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(15,2) NOT NULL,
  raised_amount DECIMAL(15,2) DEFAULT 0,
  minimum_investment DECIMAL(15,2) NOT NULL,
  maximum_investment DECIMAL(15,2),
  investment_type TEXT NOT NULL,
  location TEXT,
  expected_return TEXT,
  investment_term TEXT,
  status investment_status DEFAULT 'draft',
  closing_date TIMESTAMP WITH TIME ZONE,
  image_url TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create user investments table
CREATE TABLE public.user_investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offering_id UUID NOT NULL REFERENCES public.investment_offerings(id) ON DELETE CASCADE,
  investment_amount DECIMAL(15,2) NOT NULL,
  shares DECIMAL(15,2),
  investment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, offering_id)
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  investment_id UUID REFERENCES public.user_investments(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  reference_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  document_type document_type NOT NULL,
  offering_id UUID REFERENCES public.investment_offerings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT FALSE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create investment updates table
CREATE TABLE public.investment_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offering_id UUID NOT NULL REFERENCES public.investment_offerings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  update_type TEXT DEFAULT 'general',
  is_important BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create capital calls table
CREATE TABLE public.capital_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offering_id UUID NOT NULL REFERENCES public.investment_offerings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount_per_share DECIMAL(15,2) NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status capital_call_status DEFAULT 'pending',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capital_calls ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.is_admin(auth.uid()));

-- RLS Policies for investment_offerings
CREATE POLICY "Everyone can view active offerings"
  ON public.investment_offerings FOR SELECT
  USING (status = 'active' OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage offerings"
  ON public.investment_offerings FOR ALL
  USING (public.is_admin(auth.uid()));

-- RLS Policies for user_investments
CREATE POLICY "Users can view their own investments"
  ON public.user_investments FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can create their own investments"
  ON public.user_investments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investments"
  ON public.user_investments FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage transactions"
  ON public.transactions FOR ALL
  USING (public.is_admin(auth.uid()));

-- RLS Policies for documents
CREATE POLICY "Users can view public documents and their own"
  ON public.documents FOR SELECT
  USING (is_public = true OR auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can upload documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Admins can manage all documents"
  ON public.documents FOR ALL
  USING (public.is_admin(auth.uid()));

-- RLS Policies for investment_updates
CREATE POLICY "Everyone can view updates for active offerings"
  ON public.investment_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.investment_offerings 
      WHERE id = offering_id AND status = 'active'
    ) OR public.is_admin(auth.uid())
  );

CREATE POLICY "Admins can manage updates"
  ON public.investment_updates FOR ALL
  USING (public.is_admin(auth.uid()));

-- RLS Policies for capital_calls
CREATE POLICY "Investors can view capital calls for their investments"
  ON public.capital_calls FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_investments 
      WHERE user_id = auth.uid() AND offering_id = capital_calls.offering_id
    ) OR public.is_admin(auth.uid())
  );

CREATE POLICY "Admins can manage capital calls"
  ON public.capital_calls FOR ALL
  USING (public.is_admin(auth.uid()));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_investment_offerings_updated_at
  BEFORE UPDATE ON public.investment_offerings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_investments_updated_at
  BEFORE UPDATE ON public.user_investments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email
  );
  
  -- Assign default investor role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'investor');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_investments_user_id ON public.user_investments(user_id);
CREATE INDEX idx_user_investments_offering_id ON public.user_investments(offering_id);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_investment_id ON public.transactions(investment_id);
CREATE INDEX idx_documents_offering_id ON public.documents(offering_id);
CREATE INDEX idx_investment_updates_offering_id ON public.investment_updates(offering_id);
CREATE INDEX idx_capital_calls_offering_id ON public.capital_calls(offering_id);