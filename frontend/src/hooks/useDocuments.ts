import { useState } from 'react';
import { useEffect } from 'react';
import { api } from '@/lib/api-client';
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

// bucketName kept as the original kebab-case bucket names for call-site
// compatibility (VerificationDocumentCard.tsx, DocumentReviewModal.tsx,
// DocumentCard.tsx already call getSignedUrl(path, bucketName) on demand,
// at preview/download time, working from the RAW `file_path` these hooks
// return — mirroring exactly how they worked against Supabase Storage).
// Mapped to the backend's camelCase bucket keys at this boundary.
type BucketName = 'offering-documents' | 'verification-documents';
const BUCKET_MAP: Record<BucketName, 'offeringDocuments' | 'verificationDocuments'> = {
  'offering-documents': 'offeringDocuments',
  'verification-documents': 'verificationDocuments',
};

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
      const investments = await api.get<{ offeringId: string }[]>('/investments');
      const offeringIds = [...new Set(investments.map((inv) => inv.offeringId))];

      const perOffering = await Promise.all(
        offeringIds.map(async (offeringId) => {
          const [offering, docs] = await Promise.all([
            api.get<{ title: string }>(`/offerings/${offeringId}`),
            // Same visibility as the original: gated to fully-verified
            // investors on active offerings — can legitimately 403 for an
            // investor whose offering has since closed, or who isn't fully
            // verified. Treated as "no documents", not an error.
            api
              .get<Record<string, unknown>[]>(`/offerings/${offeringId}/documents`)
              .catch(() => []),
          ]);
          return docs.map((doc) => ({
            id: doc.id as string,
            title: doc.title as string,
            description: doc.description as string | undefined,
            file_path: doc.filePath as string,
            file_size: doc.fileSize as number | undefined,
            mime_type: doc.mimeType as string | undefined,
            created_at: doc.createdAt as string,
            category: doc.documentCategory as string,
            offering_id: offeringId,
            offering_title: offering.title,
          }));
        }),
      );

      setInvestmentDocuments(perOffering.flat());
    } catch (err) {
      console.error('Error fetching investment documents:', err);
      setError('Failed to load investment documents');
    }
  };

  const fetchVerificationDocuments = async () => {
    if (!user?.id) return;

    try {
      const docs = await api.get<Record<string, unknown>[]>('/verification-documents');
      setVerificationDocuments(
        docs.map((d) => ({
          id: d.id as string,
          title: d.title as string,
          document_type: d.documentType as string,
          file_path: d.filePath as string,
          file_name: d.fileName as string,
          file_size: d.fileSize as number | undefined,
          mime_type: d.mimeType as string | undefined,
          verification_status: d.verificationStatus as string,
          reviewer_notes: d.reviewerNotes as string | undefined,
          created_at: d.createdAt as string,
          expiry_date: d.expiryDate as string | undefined,
          is_expired: Boolean(d.isExpired),
        })),
      );
    } catch (err) {
      console.error('Error fetching verification documents:', err);
      setError('Failed to load verification documents');
    }
  };

  const fetchGeneralDocuments = async () => {
    if (!user?.id) return;

    try {
      const docs = await api.get<Record<string, unknown>[]>('/documents');
      setGeneralDocuments(
        docs.map((doc) => ({
          id: doc.id as string,
          title: doc.title as string,
          description: doc.description as string | undefined,
          file_path: doc.filePath as string,
          file_size: doc.fileSize as number | undefined,
          mime_type: doc.mimeType as string | undefined,
          created_at: doc.createdAt as string,
          category: (doc.documentType as string) || 'general',
        })),
      );
    } catch (err) {
      console.error('Error fetching general documents:', err);
      setError('Failed to load account documents');
    }
  };

  // For callers with a RAW storage path — every current caller (DocumentCard,
  // VerificationDocumentCard, DocumentReviewModal) works this way, signing
  // on demand at preview/download time rather than eagerly for a whole list.
  // See backend/src/routes/storage.ts for the authorization this enforces
  // (mirrors the original app's storage-level RLS policies specifically,
  // which are simpler than — and distinct from — the table-row policies).
  const getSignedUrl = async (filePath: string, bucketName: BucketName = 'offering-documents') => {
    try {
      const { url } = await api.post<{ url: string }>('/storage/signed-url', {
        bucket: BUCKET_MAP[bucketName],
        filePath,
      });
      return url;
    } catch (err) {
      console.error('Error getting signed URL:', err);
      return null;
    }
  };

  const downloadDocument = async (filePath: string, fileName: string) => {
    try {
      const url = await getSignedUrl(filePath, 'offering-documents');
      if (!url) throw new Error('Could not sign download URL');

      const response = await fetch(url);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();

      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);

      toast.success('Document downloaded successfully');
    } catch (err) {
      console.error('Error downloading document:', err);
      toast.error('Failed to download document');
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
