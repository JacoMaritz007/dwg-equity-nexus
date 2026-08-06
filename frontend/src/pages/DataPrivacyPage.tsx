import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, ShieldAlert, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

export const DataPrivacyPage: React.FC = () => {
  const { user } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  const handleExport = async () => {
    if (!user?.id) return;
    setExporting(true);
    try {
      const data = await api.get(`/profiles/${user.id}/export`);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Your data export has downloaded');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export your data');
    } finally {
      setExporting(false);
    }
  };

  const handleDeletionRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSubmitting(true);
    try {
      await api.post(`/profiles/${user.id}/deletion-request`, { reason: reason || undefined });
      toast.success('Your request has been submitted to our compliance team');
      setRequestSubmitted(true);
    } catch (error) {
      console.error('Error submitting deletion request:', error);
      toast.error('Failed to submit your request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Privacy &amp; Data</h1>
        <p className="text-muted-foreground">
          Your rights under South Africa's Protection of Personal Information Act (POPIA).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Request Your Data
          </CardTitle>
          <CardDescription>
            Download a copy of the personal information we hold about you — your profile, investment
            records, and verification document metadata.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport} disabled={exporting} className="w-full">
            {exporting ? 'Preparing export...' : 'Download My Data'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Request Account Deletion
          </CardTitle>
          <CardDescription>
            Request that we delete your personal information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              As a financial services platform, we're legally required under FICA to retain
              identity-verification and transaction records for a set period, even after a deletion
              request. Our compliance team will review your request and action what can be deleted,
              consistent with these obligations, then contact you.
            </AlertDescription>
          </Alert>

          {requestSubmitted ? (
            <p className="text-sm text-muted-foreground">
              Your request has been submitted and is awaiting review.
            </p>
          ) : (
            <form onSubmit={handleDeletionRequest} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="reason">Reason (optional)</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Optional context for our compliance team"
                />
              </div>
              <Button type="submit" variant="destructive" disabled={submitting} className="w-full">
                {submitting ? 'Submitting...' : 'Submit Deletion Request'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
