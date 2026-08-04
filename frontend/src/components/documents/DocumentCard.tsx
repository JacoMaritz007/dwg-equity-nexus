import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Document } from '@/hooks/useDocuments';
import { useDocuments } from '@/hooks/useDocuments';
import { 
  Download, 
  Eye, 
  FileText, 
  Calendar,
  Building,
  Tag
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface DocumentCardProps {
  document: Document;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ document }) => {
  const { downloadDocument, getSignedUrl } = useDocuments();

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

  const handleDownload = () => {
    downloadDocument(document.file_path, document.title);
  };

  const handlePreview = async () => {
    const signedUrl = await getSignedUrl(document.file_path);
    if (signedUrl) {
      window.open(signedUrl, '_blank');
    } else {
      toast.error('Unable to preview document');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'investment_memorandum': 'bg-blue-100 text-blue-800 border-blue-200',
      'legal_structure': 'bg-purple-100 text-purple-800 border-purple-200',
      'financial_projections': 'bg-green-100 text-green-800 border-green-200',
      'operating_agreement': 'bg-orange-100 text-orange-800 border-orange-200',
      'other_supporting': 'bg-gray-100 text-gray-800 border-gray-200',
      'general': 'bg-slate-100 text-slate-800 border-slate-200'
    };
    return colors[category] || colors['general'];
  };

  const formatCategoryName = (category: string) => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base line-clamp-2">{document.title}</CardTitle>
              {document.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {document.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Document Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Tag className="h-3 w-3 text-muted-foreground" />
            <Badge 
              variant="outline" 
              className={getCategoryColor(document.category)}
            >
              {formatCategoryName(document.category)}
            </Badge>
          </div>
          
          {document.offering_title && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building className="h-3 w-3" />
              <span className="truncate">{document.offering_title}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              {formatDistanceToNow(new Date(document.created_at), { addSuffix: true })}
            </span>
          </div>
          
          {document.file_size && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span>{formatFileSize(document.file_size)}</span>
              {document.mime_type && (
                <>
                  <span>•</span>
                  <span className="uppercase">{document.mime_type.split('/')[1]}</span>
                </>
              )}
            </div>
          )}
        </div>
        
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