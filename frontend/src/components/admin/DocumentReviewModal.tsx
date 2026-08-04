import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Check, 
  X, 
  Download, 
  Eye, 
  Calendar, 
  User, 
  FileText, 
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

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

interface DocumentReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: VerificationDocumentWithUser;
  onReview: (documentId: string, status: 'approved' | 'rejected', notes?: string) => Promise<void>;
  getSignedUrl: (filePath: string, bucketName?: string) => Promise<string | null>;
}

export const DocumentReviewModal: React.FC<DocumentReviewModalProps> = ({
  open,
  onOpenChange,
  document,
  onReview,
  getSignedUrl
}) => {
  const [reviewNotes, setReviewNotes] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && document) {
      setReviewNotes(document.reviewer_notes || '');
      loadPreview();
    }
  }, [open, document]);

  const loadPreview = async () => {
    try {
      const url = await getSignedUrl(document.file_path, 'verification-documents');
      setPreviewUrl(url);
    } catch (error) {
      console.error('Error loading preview:', error);
      toast.error('Failed to load document preview');
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const url = await getSignedUrl(document.file_path, 'verification-documents');
      
      if (url) {
        const response = await fetch(url);
        const blob = await response.blob();
        
        const downloadUrl = URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = downloadUrl;
        a.download = document.file_name;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
        
        toast.success('Document downloaded successfully');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    } finally {
      setDownloading(false);
    }
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onReview(document.id, 'approved', reviewNotes);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!reviewNotes.trim()) {
      toast.error('Please provide rejection notes');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onReview(document.id, 'rejected', reviewNotes);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><Check className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending Review</Badge>;
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
      default: return type;
    }
  };

  const isImageFile = document.mime_type?.startsWith('image/');
  const isPdfFile = document.mime_type === 'application/pdf';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="w-5 h-5" />
            Document Review: {document.title}
          </DialogTitle>
          <DialogDescription>
            Review and approve or reject this verification document
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Document Information */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Document Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  {getStatusBadge(document.verification_status)}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Type:</span>
                  <Badge variant="outline">{getDocumentTypeLabel(document.document_type)}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">File Name:</span>
                  <span className="text-sm text-muted-foreground">{document.file_name}</span>
                </div>
                
                {document.file_size && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">File Size:</span>
                    <span className="text-sm text-muted-foreground">
                      {(document.file_size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Uploaded:</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(document.created_at).toLocaleString()}
                  </span>
                </div>
                
                {document.expiry_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Expires:</span>
                    <div className="flex items-center gap-2">
                      {document.is_expired && <AlertTriangle className="w-4 h-4 text-red-500" />}
                      <span className={`text-sm ${document.is_expired ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {new Date(document.expiry_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-4 h-4" />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Name:</span>
                  <span className="text-sm text-muted-foreground">{document.user_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Email:</span>
                  <span className="text-sm text-muted-foreground">{document.user_email}</span>
                </div>
              </CardContent>
            </Card>

            {/* Review Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Review Notes</CardTitle>
                <CardDescription>
                  Add notes about your review decision
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Label htmlFor="reviewNotes">Notes</Label>
                <Textarea
                  id="reviewNotes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add your review notes here..."
                  className="mt-2"
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          {/* Document Preview */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Document Preview</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                      disabled={downloading}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      {downloading ? 'Downloading...' : 'Download'}
                    </Button>
                    {previewUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(previewUrl, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Open
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {previewUrl ? (
                  <div className="space-y-4">
                    {isImageFile ? (
                      <img
                        src={previewUrl}
                        alt={document.title}
                        className="w-full h-auto max-h-96 object-contain rounded-lg border"
                      />
                    ) : isPdfFile ? (
                      <div className="w-full h-96 border rounded-lg">
                        <iframe
                          src={previewUrl}
                          className="w-full h-full rounded-lg"
                          title={document.title}
                        />
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          Preview not available for this file type
                        </p>
                        <Button
                          variant="outline"
                          onClick={handleDownload}
                          className="mt-4"
                          disabled={downloading}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download to view
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Loading preview...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        {document.verification_status === 'pending' && (
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isSubmitting}
            >
              <X className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Rejecting...' : 'Reject'}
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isSubmitting}
            >
              <Check className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Approving...' : 'Approve'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};