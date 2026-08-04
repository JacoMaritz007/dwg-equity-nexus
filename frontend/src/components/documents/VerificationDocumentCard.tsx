import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { VerificationDocument } from '@/hooks/useDocuments';
import { useDocuments } from '@/hooks/useDocuments';
import { 
  Download, 
  Eye, 
  Shield, 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';
import { formatDistanceToNow, format, isAfter } from 'date-fns';
import { toast } from 'sonner';

interface VerificationDocumentCardProps {
  document: VerificationDocument;
}

export const VerificationDocumentCard: React.FC<VerificationDocumentCardProps> = ({ document }) => {
  const { getSignedUrl } = useDocuments();

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const handleDownload = async () => {
    const signedUrl = await getSignedUrl(document.file_path, 'verification-documents');
    if (signedUrl) {
      // Create a temporary link to download the file
      const link = window.document.createElement('a');
      link.href = signedUrl;
      link.download = document.file_name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      toast.success('Document download started');
    } else {
      toast.error('Unable to download document');
    }
  };

  const handlePreview = async () => {
    const signedUrl = await getSignedUrl(document.file_path, 'verification-documents');
    if (signedUrl) {
      window.open(signedUrl, '_blank');
    } else {
      toast.error('Unable to preview document');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success/10 text-success border-success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-warning/10 text-warning border-warning">Pending Review</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatDocumentType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const isExpiringSoon = () => {
    if (!document.expiry_date) return false;
    const expiryDate = new Date(document.expiry_date);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return isAfter(thirtyDaysFromNow, expiryDate);
  };

  const isExpired = () => {
    return document.is_expired || (document.expiry_date && isAfter(new Date(), new Date(document.expiry_date)));
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${isExpired() ? 'border-destructive/50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base line-clamp-2">{document.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {formatDocumentType(document.document_type)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(document.verification_status)}
            {getStatusBadge(document.verification_status)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Warnings */}
        {isExpired() && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive font-medium">Document Expired</span>
          </div>
        )}
        
        {!isExpired() && isExpiringSoon() && (
          <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-sm text-warning font-medium">Expires Soon</span>
          </div>
        )}

        {/* Document Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              Uploaded {formatDistanceToNow(new Date(document.created_at), { addSuffix: true })}
            </span>
          </div>
          
          {document.expiry_date && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                Expires {format(new Date(document.expiry_date), 'MMM dd, yyyy')}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-3 w-3" />
            <span>{formatFileSize(document.file_size)}</span>
            {document.mime_type && (
              <>
                <span>•</span>
                <span className="uppercase">{document.mime_type.split('/')[1]}</span>
              </>
            )}
          </div>
        </div>

        {/* Reviewer Notes */}
        {document.reviewer_notes && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="h-3 w-3" />
                Reviewer Notes
              </div>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                {document.reviewer_notes}
              </p>
            </div>
          </>
        )}
        
        <Separator />
        
        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
            className="flex-1 gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button
            size="sm"
            onClick={handleDownload}
            className="flex-1 gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};