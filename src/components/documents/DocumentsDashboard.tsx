import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useDocuments } from '@/hooks/useDocuments';
import { DocumentCard } from './DocumentCard';
import { VerificationDocumentCard } from './VerificationDocumentCard';
import { DocumentUploader } from './DocumentUploader';
import { 
  FileText, 
  Shield, 
  Briefcase, 
  User, 
  Search,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const DocumentsDashboard: React.FC = () => {
  const {
    investmentDocuments,
    verificationDocuments,
    generalDocuments,
    loading,
    error,
    refetch
  } = useDocuments();

  const [searchTerm, setSearchTerm] = useState('');
  const [showUploader, setShowUploader] = useState(false);

  // Filter documents based on search term
  const filterDocuments = (documents: any[]) => {
    if (!searchTerm) return documents;
    return documents.filter(doc =>
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getVerificationStats = () => {
    const approved = verificationDocuments.filter(doc => doc.verification_status === 'approved').length;
    const pending = verificationDocuments.filter(doc => doc.verification_status === 'pending').length;
    const rejected = verificationDocuments.filter(doc => doc.verification_status === 'rejected').length;
    
    return { approved, pending, rejected, total: verificationDocuments.length };
  };

  const stats = getVerificationStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="max-w-md text-center">
          <CardContent className="pt-6">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Documents</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={refetch}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={() => setShowUploader(!showUploader)}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload Documents
        </Button>
      </div>

      {/* Document Upload Component */}
      {showUploader && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Verification Documents</CardTitle>
            <CardDescription>
              Upload documents required for account verification and compliance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentUploader onSuccess={() => {
              setShowUploader(false);
              refetch();
            }} />
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Briefcase className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{investmentDocuments.length}</p>
                <p className="text-sm text-muted-foreground">Investment Docs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-sm text-muted-foreground">Verified Docs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-warning" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{generalDocuments.length}</p>
                <p className="text-sm text-muted-foreground">Account Docs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents Tabs */}
      <Tabs defaultValue="investments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="investments" className="gap-2">
            <Briefcase className="h-4 w-4" />
            My Investments
          </TabsTrigger>
          <TabsTrigger value="verification" className="gap-2">
            <Shield className="h-4 w-4" />
            Verification
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2">
            <FileText className="h-4 w-4" />
            Account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="investments" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Investment Documents</h3>
              <p className="text-sm text-muted-foreground">
                Documents related to your active investments and offerings.
              </p>
            </div>
            <Badge variant="secondary">{investmentDocuments.length} documents</Badge>
          </div>
          
          {filterDocuments(investmentDocuments).length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Investment Documents</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'No documents match your search.' : 'You don\'t have any investment documents yet.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filterDocuments(investmentDocuments).map(doc => (
                <DocumentCard key={doc.id} document={doc} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Verification Documents</h3>
              <p className="text-sm text-muted-foreground">
                KYC and compliance documents for account verification.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{stats.total} total</Badge>
              <Badge variant="outline" className="text-success border-success">
                {stats.approved} verified
              </Badge>
            </div>
          </div>
          
          {filterDocuments(verificationDocuments).length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Verification Documents</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'No documents match your search.' : 'Upload identity and compliance documents to verify your account.'}
                </p>
                <Button 
                  className="mt-4" 
                  onClick={() => setShowUploader(true)}
                >
                  Upload Documents
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filterDocuments(verificationDocuments).map(doc => (
                <VerificationDocumentCard key={doc.id} document={doc} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Account Documents</h3>
              <p className="text-sm text-muted-foreground">
                Statements, agreements, and other account-related documents.
              </p>
            </div>
            <Badge variant="secondary">{generalDocuments.length} documents</Badge>
          </div>
          
          {filterDocuments(generalDocuments).length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Account Documents</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'No documents match your search.' : 'Account statements and documents will appear here.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filterDocuments(generalDocuments).map(doc => (
                <DocumentCard key={doc.id} document={doc} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};