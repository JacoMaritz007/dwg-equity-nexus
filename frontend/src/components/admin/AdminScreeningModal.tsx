import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Upload, 
  FileText, 
  Shield, 
  AlertTriangle,
  Calendar,
  User,
  Building,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';

interface AdminScreeningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  userEmail: string;
  screeningType: 'pep' | 'sanctions';
  onScreeningComplete: () => void;
}

export const AdminScreeningModal: React.FC<AdminScreeningModalProps> = ({
  open,
  onOpenChange,
  userId,
  userName,
  userEmail,
  screeningType,
  onScreeningComplete
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [screeningProvider, setScreeningProvider] = useState('');
  const [screeningReference, setScreeningReference] = useState('');
  const [notes, setNotes] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type (PDF or image)
      if (selectedFile.type.startsWith('image/') || selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
      } else {
        toast.error('Please select a PDF or image file');
      }
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Please select a screening document');
      return;
    }

    if (!screeningProvider.trim()) {
      toast.error('Please specify the screening provider');
      return;
    }

    setUploading(true);

    try {
      // Two-step flow, split for a reason: the old Supabase Edge Function
      // marked the screening record 'approved' (and flipped the profile's
      // pep_screened/sanctions_screened flag) BEFORE the file upload even
      // happened — a failed or abandoned upload still left the user marked
      // as screened with nothing behind it. The backend now only does that
      // after /confirm-upload, once the upload below has actually
      // succeeded (see backend/src/routes/compliance.ts).
      const { uploadUrl, data } = await api.post<{
        uploadUrl: string;
        data: { id: string };
      }>('/compliance-screening/initiate', {
        userId,
        screeningType,
        screeningProvider,
        screeningReference: screeningReference || undefined,
        expiryDate: expiryDate || undefined,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        notes: notes || undefined,
      });

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to storage');
      }

      await api.post(`/compliance-screening/${data.id}/confirm-upload`);

      toast.success(`${screeningType.toUpperCase()} screening completed successfully`);
      onScreeningComplete();
      onOpenChange(false);
      
      // Reset form
      setFile(null);
      setScreeningProvider('');
      setScreeningReference('');
      setNotes('');
      setExpiryDate('');
    } catch (error: any) {
      console.error('Error uploading screening document:', error);
      toast.error(error.message || 'Failed to complete screening');
    } finally {
      setUploading(false);
    }
  };

  const getScreeningTitle = () => {
    return screeningType === 'pep' 
      ? 'PEP (Politically Exposed Person) Screening' 
      : 'Sanctions List Screening';
  };

  const getScreeningDescription = () => {
    return screeningType === 'pep'
      ? 'Upload PEP screening results and documentation'
      : 'Upload sanctions list screening results and documentation';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Shield className="w-5 h-5" />
            {getScreeningTitle()}
          </DialogTitle>
          <DialogDescription>
            {getScreeningDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Information */}
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
                <span className="text-sm text-muted-foreground">{userName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Email:</span>
                <span className="text-sm text-muted-foreground">{userEmail}</span>
              </div>
            </CardContent>
          </Card>

          {/* Screening Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="screeningProvider">Screening Provider *</Label>
                <Select value={screeningProvider} onValueChange={setScreeningProvider}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="worldcheck">World Check</SelectItem>
                    <SelectItem value="dowjones">Dow Jones</SelectItem>
                    <SelectItem value="lexisnexis">LexisNexis</SelectItem>
                    <SelectItem value="refinitiv">Refinitiv</SelectItem>
                    <SelectItem value="complycube">ComplyCube</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="screeningReference">Reference Number</Label>
                <Input
                  id="screeningReference"
                  value={screeningReference}
                  onChange={(e) => setScreeningReference(e.target.value)}
                  placeholder="Screening reference/ID"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Screening Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any relevant notes about the screening results..."
                rows={3}
              />
            </div>
          </div>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Upload Screening Document
              </CardTitle>
              <CardDescription>
                Upload the screening report or certificate (PDF or image files only)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="screening-file-upload"
                  />
                  <label
                    htmlFor="screening-file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Click to upload screening document</p>
                      <p className="text-xs text-muted-foreground">PDF or image files only</p>
                    </div>
                  </label>
                </div>

                {file && (
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{file.name}</span>
                    <Badge variant="outline" className="ml-auto">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={uploading || !file || !screeningProvider.trim()}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading...' : 'Complete Screening'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};