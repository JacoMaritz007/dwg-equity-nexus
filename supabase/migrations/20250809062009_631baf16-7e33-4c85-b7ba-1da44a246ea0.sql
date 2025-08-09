-- Create compliance_screening_documents table for PEP/sanctions screening results
CREATE TABLE public.compliance_screening_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  screening_type TEXT NOT NULL CHECK (screening_type IN ('pep', 'sanctions')),
  status verification_status NOT NULL DEFAULT 'pending',
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID NOT NULL,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  screening_date DATE NOT NULL DEFAULT CURRENT_DATE,
  screening_provider TEXT,
  screening_reference TEXT,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.compliance_screening_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for compliance screening documents
CREATE POLICY "Users can view their own screening documents" 
ON public.compliance_screening_documents 
FOR SELECT 
USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage all screening documents" 
ON public.compliance_screening_documents 
FOR ALL 
USING (is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_compliance_screening_documents_updated_at
BEFORE UPDATE ON public.compliance_screening_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_compliance_screening_documents_user_id ON public.compliance_screening_documents(user_id);
CREATE INDEX idx_compliance_screening_documents_screening_type ON public.compliance_screening_documents(screening_type);
CREATE INDEX idx_compliance_screening_documents_status ON public.compliance_screening_documents(status);