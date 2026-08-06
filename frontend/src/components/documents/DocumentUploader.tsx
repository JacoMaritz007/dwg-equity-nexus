import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { api, uploadFile as putFileToSignedUrl } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Upload, X, FileText, CheckCircle } from 'lucide-react';

interface DocumentUploaderProps {
  onSuccess?: () => void;
  preselectedCategory?: 'identity' | 'address' | 'financial' | 'accreditation';
  allowedDocumentTypes?: string[];
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({ 
  onSuccess, 
  preselectedCategory,
  allowedDocumentTypes 
}) => {
  const { user } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [documentType, setDocumentType] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const allDocumentTypes = [
    { value: 'passport', label: 'Passport' },
    { value: 'driving_license', label: 'Driver\'s License' },
    { value: 'national_id', label: 'National ID' },
    { value: 'proof_of_address', label: 'Proof of Address' },
    { value: 'bank_statement', label: 'Bank Statement' },
    { value: 'income_verification', label: 'Income Verification' },
    { value: 'source_of_wealth', label: 'Source of Wealth' },
    { value: 'pep_declaration', label: 'PEP Declaration' },
    { value: 'sophisticated_investor_cert', label: 'Sophisticated Investor Certificate' },
    { value: 'professional_qualification', label: 'Professional Qualification' }
  ];

  const documentTypes = allowedDocumentTypes 
    ? allDocumentTypes.filter(type => allowedDocumentTypes.includes(type.value))
    : allDocumentTypes;

  // Auto-select document type if only one is allowed
  React.useEffect(() => {
    if (allowedDocumentTypes && allowedDocumentTypes.length === 1 && !documentType) {
      setDocumentType(allowedDocumentTypes[0]);
    }
  }, [allowedDocumentTypes, documentType]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Two-step upload: ask the backend for a signed upload URL (it decides
  // the storage path, scoped to the caller's own uid — see
  // userScopedPath in backend/src/storage/signed-urls.ts), PUT the file
  // directly to Cloud Storage, then return the path for the DB row.
  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const { url, filePath } = await api.post<{ url: string; filePath: string }>(
        '/verification-documents/upload-url',
        { fileName: `${documentType}_${Date.now()}.${fileExt}`, contentType: file.type },
      );
      await putFileToSignedUrl(url, file);
      return filePath;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !documentType || selectedFiles.length === 0) {
      toast.error('Please fill in all required fields and select files');
      return;
    }

    setIsUploading(true);
    const uploadingFiles: UploadingFile[] = selectedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }));
    setUploadingFiles(uploadingFiles);

    let successCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      try {
        // Update progress
        setUploadingFiles(prev => 
          prev.map((uf, index) => 
            index === i ? { ...uf, progress: 30 } : uf
          )
        );

        // Upload file
        const filePath = await uploadFile(file);
        
        if (!filePath) {
          throw new Error('Failed to upload file');
        }

        // Update progress
        setUploadingFiles(prev => 
          prev.map((uf, index) => 
            index === i ? { ...uf, progress: 60 } : uf
          )
        );

        // Save to database
        await api.post('/verification-documents', {
          documentType,
          title: title || file.name,
          filePath,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        });

        // Update to success
        setUploadingFiles(prev => 
          prev.map((uf, index) => 
            index === i ? { ...uf, progress: 100, status: 'success' } : uf
          )
        );

        successCount++;
      } catch (error) {
        console.error('Error uploading file:', error);
        setUploadingFiles(prev => 
          prev.map((uf, index) => 
            index === i ? { 
              ...uf, 
              progress: 0, 
              status: 'error',
              error: error instanceof Error ? error.message : 'Upload failed'
            } : uf
          )
        );
      }
    }

    setIsUploading(false);

    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} document(s)`);
      setSelectedFiles([]);
      setTitle('');
      setDescription('');
      setDocumentType('');
      onSuccess?.();
    }

    // Clear uploading files after a delay
    setTimeout(() => {
      setUploadingFiles([]);
    }, 3000);
  };

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Document Type Selection */}
      <div className="space-y-2">
        <Label htmlFor="documentType">Document Type *</Label>
        <Select value={documentType} onValueChange={setDocumentType}>
          <SelectTrigger>
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>
          <SelectContent>
            {documentTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Title (Optional)</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Document title (will use filename if empty)"
        />
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <Label htmlFor="files">Upload Files *</Label>
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
          <div className="text-center">
            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <Label htmlFor="files" className="cursor-pointer">
              <span className="text-sm font-medium text-primary hover:text-primary/80">
                Click to upload files
              </span>
              <span className="text-sm text-muted-foreground"> or drag and drop</span>
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, PNG, JPG up to 10MB each
            </p>
          </div>
          <Input
            id="files"
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <Label>Selected Files</Label>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <Label>Upload Progress</Label>
          <div className="space-y-2">
            {uploadingFiles.map((uploadingFile, index) => (
              <div key={index} className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {uploadingFile.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : uploadingFile.status === 'error' ? (
                      <X className="h-4 w-4 text-destructive" />
                    ) : (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{uploadingFile.file.name}</p>
                      {uploadingFile.error && (
                        <p className="text-xs text-destructive">{uploadingFile.error}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {uploadingFile.progress}%
                  </span>
                </div>
                <Progress value={uploadingFile.progress} className="h-2" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button 
        type="submit" 
        disabled={!documentType || selectedFiles.length === 0 || isUploading}
        className="w-full"
      >
        {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} Document(s)`}
      </Button>
    </form>
  );
};