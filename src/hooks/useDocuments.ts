import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Document {
  id: string;
  title: string;
  description?: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  created_at: string;
  category: string;
  offering_id?: string;
  offering_title?: string;
}

export interface VerificationDocument {
  id: string;
  title: string;
  document_type: string;
  file_path: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  verification_status: string;
  reviewer_notes?: string;
  created_at: string;
  expiry_date?: string;
  is_expired: boolean;
}

export const useDocuments = () => {
  const { user } = useAuth();
  const [investmentDocuments, setInvestmentDocuments] = useState<Document[]>([]);
  const [verificationDocuments, setVerificationDocuments] = useState<VerificationDocument[]>([]);
  const [generalDocuments, setGeneralDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvestmentDocuments = async () => {
    if (!user?.id) return;

    try {
      // Get user's investments first
      const { data: investments, error: investmentsError } = await supabase
        .from('user_investments')
        .select('offering_id')
        .eq('user_id', user.id);

      if (investmentsError) throw investmentsError;

      if (investments && investments.length > 0) {
        const offeringIds = investments.map(inv => inv.offering_id);
        
        // Get documents for user's investments
        const { data: docs, error: docsError } = await supabase
          .from('offering_documents')
          .select(`
            id,
            title,
            description,
            file_path,
            file_name,
            file_size,
            mime_type,
            document_category,
            created_at,
            offering_id,
            investment_offerings!inner(title)
          `)
          .in('offering_id', offeringIds)
          .order('created_at', { ascending: false });

        if (docsError) throw docsError;

        const formattedDocs = docs?.map(doc => ({
          id: doc.id,
          title: doc.title,
          description: doc.description,
          file_path: doc.file_path,
          file_size: doc.file_size,
          mime_type: doc.mime_type,
          created_at: doc.created_at,
          category: doc.document_category,
          offering_id: doc.offering_id,
          offering_title: (doc.investment_offerings as any)?.title
        })) || [];

        setInvestmentDocuments(formattedDocs);
      }
    } catch (err) {
      console.error('Error fetching investment documents:', err);
      setError('Failed to load investment documents');
    }
  };

  const fetchVerificationDocuments = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('verification_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVerificationDocuments(data || []);
    } catch (err) {
      console.error('Error fetching verification documents:', err);
      setError('Failed to load verification documents');
    }
  };

  const fetchGeneralDocuments = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedDocs = data?.map(doc => ({
        id: doc.id,
        title: doc.title,
        description: doc.description,
        file_path: doc.file_path,
        file_size: doc.file_size,
        mime_type: doc.mime_type,
        created_at: doc.created_at,
        category: doc.document_type || 'general'
      })) || [];

      setGeneralDocuments(formattedDocs);
    } catch (err) {
      console.error('Error fetching general documents:', err);
      setError('Failed to load account documents');
    }
  };

  const downloadDocument = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('offering-documents')
        .download(filePath);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Document downloaded successfully');
    } catch (err) {
      console.error('Error downloading document:', err);
      toast.error('Failed to download document');
    }
  };

  const getSignedUrl = async (filePath: string, bucketName: string = 'offering-documents') => {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;
      return data.signedUrl;
    } catch (err) {
      console.error('Error getting signed URL:', err);
      return null;
    }
  };

  useEffect(() => {
    if (user?.id) {
      const fetchAllDocuments = async () => {
        setLoading(true);
        setError(null);
        
        await Promise.all([
          fetchInvestmentDocuments(),
          fetchVerificationDocuments(),
          fetchGeneralDocuments()
        ]);
        
        setLoading(false);
      };

      fetchAllDocuments();
    }
  }, [user?.id]);

  const refetch = () => {
    if (user?.id) {
      fetchInvestmentDocuments();
      fetchVerificationDocuments();
      fetchGeneralDocuments();
    }
  };

  return {
    investmentDocuments,
    verificationDocuments,
    generalDocuments,
    loading,
    error,
    downloadDocument,
    getSignedUrl,
    refetch
  };
};