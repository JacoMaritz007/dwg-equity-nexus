import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ShieldAlert, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface DeletionRequestRow {
  id: string;
  userId: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'denied';
  reviewerNotes: string | null;
  createdAt: string;
}

interface ProfileRow {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

const AdminDataRequests: React.FC = () => {
  const { canAccessAdmin } = usePermissions();
  const [requests, setRequests] = useState<DeletionRequestRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [reqs, profs] = await Promise.all([
        api.get<DeletionRequestRow[]>('/data-deletion-requests'),
        api.get<ProfileRow[]>('/profiles'),
      ]);
      setRequests(reqs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setProfiles(profs);
    } catch (err) {
      console.error('Error fetching deletion requests:', err);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canAccessAdmin()) fetchAll();
  }, [canAccessAdmin, fetchAll]);

  const profileById = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);
  const displayName = (userId: string) => {
    const p = profileById.get(userId);
    if (!p) return userId;
    return [p.firstName, p.lastName].filter(Boolean).join(' ').trim() || p.email || userId;
  };

  const handleReview = async (id: string, status: 'approved' | 'denied') => {
    try {
      await api.post(`/data-deletion-requests/${id}/review`, {
        status,
        reviewerNotes: notes[id] || undefined,
      });
      toast.success(`Request ${status}`);
      fetchAll();
    } catch (err) {
      console.error('Error reviewing request:', err);
      toast.error('Failed to update request');
    }
  };

  if (!canAccessAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const pending = requests.filter((r) => r.status === 'pending');
  const resolved = requests.filter((r) => r.status !== 'pending');

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Data Requests</h1>
        <p className="text-muted-foreground mt-2">
          POPIA account-deletion requests awaiting compliance review. Approving here does not delete
          anything automatically — action what can be removed consistent with FICA retention
          obligations, then mark the request accordingly.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" />
                Pending ({pending.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pending.length === 0 ? (
                <p className="text-muted-foreground text-sm">No pending requests.</p>
              ) : (
                pending.map((req) => (
                  <div key={req.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{displayName(req.userId)}</p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {req.reason && <p className="text-sm text-muted-foreground">{req.reason}</p>}
                    <Textarea
                      placeholder="Reviewer notes (optional)"
                      value={notes[req.id] ?? ''}
                      onChange={(e) => setNotes({ ...notes, [req.id]: e.target.value })}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleReview(req.id, 'approved')}>
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReview(req.id, 'denied')}>
                        <X className="w-4 h-4 mr-1" />
                        Deny
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {resolved.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Resolved</CardTitle>
                <CardDescription>Previously reviewed requests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {resolved.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <p className="text-sm">{displayName(req.userId)}</p>
                    <Badge variant={req.status === 'approved' ? 'default' : 'secondary'}>
                      {req.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDataRequests;
