import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, FileText, Search, Filter, Download, Eye, Check, X, Clock, User, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { DocumentReviewModal } from '@/components/admin/DocumentReviewModal';
import { useDocuments } from '@/hooks/useDocuments';

interface VerificationDocumentWithUser {
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
  updated_at: string;
  expiry_date?: string;
  is_expired: boolean;
  user_id: string;
  user_email?: string;
  user_name?: string;
}

const AdminDocuments: React.FC = () => {
  const { user, hasRole } = usePermissions();
  const { getSignedUrl } = useDocuments();
  const [documents, setDocuments] = useState<VerificationDocumentWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedDocument, setSelectedDocument] = useState<VerificationDocumentWithUser | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  // Memoize admin status to prevent re-renders
  const isAdmin = useMemo(() => {
    return hasRole('admin');
  }, [hasRole]);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);

      // No joined query on the backend (yet) — two calls, joined
      // client-side. Both are admin-only and return every row (see
      // backend/authz/policies.ts canViewVerificationDocument / GET /profiles).
      const [docs, allProfiles] = await Promise.all([
        api.get<Record<string, unknown>[]>('/verification-documents'),
        api.get<Record<string, unknown>[]>('/profiles'),
      ]);

      const profileById = new Map(allProfiles.map((p) => [p.id as string, p]));

      const formattedDocs: VerificationDocumentWithUser[] = docs
        .map((doc) => {
          const profile = profileById.get(doc.userId as string);
          const firstName = ((profile?.firstName as string) || '').trim();
          const lastName = ((profile?.lastName as string) || '').trim();
          const email = (profile?.email as string) || 'Unknown';

          let displayName = '';
          if (firstName && lastName) displayName = `${firstName} ${lastName}`;
          else if (firstName) displayName = firstName;
          else if (lastName) displayName = lastName;
          else displayName = email;

          return {
            id: doc.id as string,
            title: doc.title as string,
            document_type: doc.documentType as string,
            file_path: doc.filePath as string,
            file_name: doc.fileName as string,
            file_size: doc.fileSize as number | undefined,
            mime_type: doc.mimeType as string | undefined,
            verification_status: doc.verificationStatus as string,
            reviewer_notes: doc.reviewerNotes as string | undefined,
            created_at: doc.createdAt as string,
            updated_at: doc.updatedAt as string,
            expiry_date: doc.expiryDate as string | undefined,
            is_expired: Boolean(doc.isExpired),
            user_id: doc.userId as string,
            user_email: email,
            user_name: displayName,
          };
        })
        .sort((a, b) => b.created_at.localeCompare(a.created_at));

      setDocuments(formattedDocs);
    } catch (err) {
      console.error('Error fetching documents:', err);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only fetch documents when user is admin
    if (isAdmin) {
      fetchDocuments();
    }
  }, [isAdmin, fetchDocuments]);

  const handleReviewDocument = async (documentId: string, status: 'approved' | 'rejected', notes?: string) => {
    try {
      // The backend's /review endpoint handles both the status update AND
      // (when approved) flipping the matching profiles.*_verified flag,
      // atomically, as an admin-authorized action — see the comment on
      // that route in backend/src/routes/verification.ts for why this
      // moved server-side rather than staying a second client-side call.
      await api.post(`/verification-documents/${documentId}/review`, { status, notes });

      toast.success(`Document ${status} successfully`);
      fetchDocuments();
      setReviewModalOpen(false);
    } catch (err) {
      console.error('Error updating document:', err);
      toast.error('Failed to update document status');
    }
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = searchTerm === '' || 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.user_email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || doc.verification_status === statusFilter;
      const matchesType = typeFilter === 'all' || doc.document_type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [documents, searchTerm, statusFilter, typeFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><Check className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'passport': return 'Passport';
      case 'national_id': return 'National ID';
      case 'driving_license': return 'Driving License';
      case 'proof_of_address': return 'Proof of Address';
      case 'bank_statement': return 'Bank Statement';
      case 'income_verification': return 'Income Verification';
      case 'source_of_wealth': return 'Source of Wealth';
      case 'sophisticated_investor_cert': return 'Sophisticated Investor Certificate';
      case 'professional_qualification': return 'Professional Qualification';
      default: return type;
    }
  };

  const stats = useMemo(() => ({
    total: documents.length,
    pending: documents.filter(d => d.verification_status === 'pending').length,
    approved: documents.filter(d => d.verification_status === 'approved').length,
    rejected: documents.filter(d => d.verification_status === 'rejected').length,
  }), [documents]);

  // Show access denied if user is not admin
  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground mt-2">You don't have admin permissions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Document Review</h1>
        <p className="text-muted-foreground mt-2">
          Review and manage user verification documents
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <X className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verification Documents</CardTitle>
          <CardDescription>
            Review user-submitted verification documents
          </CardDescription>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by document title, user name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="passport">Passport</SelectItem>
                <SelectItem value="national_id">National ID</SelectItem>
                <SelectItem value="driving_license">Driving License</SelectItem>
                <SelectItem value="proof_of_address">Proof of Address</SelectItem>
                <SelectItem value="bank_statement">Bank Statement</SelectItem>
                <SelectItem value="income_verification">Income Verification</SelectItem>
                <SelectItem value="source_of_wealth">Source of Wealth</SelectItem>
                <SelectItem value="sophisticated_investor_cert">Sophisticated Investor Certificate</SelectItem>
                <SelectItem value="professional_qualification">Professional Qualification</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading documents...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No documents found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDocuments.map(doc => (
                <div key={doc.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{doc.title}</h3>
                        {getStatusBadge(doc.verification_status)}
                        <Badge variant="outline">{getDocumentTypeLabel(doc.document_type)}</Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {doc.user_name} ({doc.user_email})
                        </div>
                        <div>
                          Uploaded: {new Date(doc.created_at).toLocaleDateString()}
                        </div>
                        {doc.file_size && (
                          <div>
                            Size: {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        )}
                      </div>
                      
                      {doc.reviewer_notes && (
                        <div className="mt-2 p-2 bg-muted rounded text-sm">
                          <strong>Review Notes:</strong> {doc.reviewer_notes}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDocument(doc);
                          setReviewModalOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Review Modal */}
      {selectedDocument && (
        <DocumentReviewModal
          open={reviewModalOpen}
          onOpenChange={setReviewModalOpen}
          document={selectedDocument}
          onReview={handleReviewDocument}
          getSignedUrl={getSignedUrl}
        />
      )}

    </div>
  );
};

export default AdminDocuments;