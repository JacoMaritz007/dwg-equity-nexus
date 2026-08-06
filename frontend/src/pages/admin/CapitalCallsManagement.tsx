import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Check, Clock, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/offeringHelpers';

interface CapitalCallRow {
  id: string;
  offeringId: string;
  title: string;
  description: string | null;
  amountPerShare: string;
  dueDate: string;
  status: string;
}

interface DrawRow {
  id: string;
  capitalCallId: string;
  investmentId: string;
  userId: string;
  amountDue: string;
  amountPaid: string | null;
  status: string;
  paymentReference: string | null;
}

interface ProfileRow {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

const drawStatusBadge = (status: string) => {
  switch (status) {
    case 'confirmed':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><Check className="w-3 h-3 mr-1" />Confirmed</Badge>;
    case 'payment_submitted':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Payment Submitted</Badge>;
    case 'waived':
      return <Badge variant="secondary">Waived</Badge>;
    default:
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="w-3 h-3 mr-1" />Due</Badge>;
  }
};

const CapitalCallsManagement: React.FC = () => {
  const { canAccessAdmin } = usePermissions();
  const [calls, setCalls] = useState<(CapitalCallRow & { offeringTitle: string })[]>([]);
  const [draws, setDraws] = useState<DrawRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const offerings = await api.get<{ id: string; title: string }[]>('/offerings');
      const perOffering = await Promise.all(
        offerings.map((o) =>
          api
            .get<CapitalCallRow[]>(`/offerings/${o.id}/capital-calls`)
            .then((rows) => rows.map((r) => ({ ...r, offeringTitle: o.title }))),
        ),
      );
      const [allDraws, allProfiles] = await Promise.all([
        api.get<DrawRow[]>('/capital-call-draws'),
        api.get<ProfileRow[]>('/profiles'),
      ]);
      setCalls(perOffering.flat().sort((a, b) => b.dueDate.localeCompare(a.dueDate)));
      setDraws(allDraws);
      setProfiles(allProfiles);
    } catch (err) {
      console.error('Error fetching capital calls:', err);
      toast.error('Failed to load capital calls');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canAccessAdmin()) fetchAll();
  }, [canAccessAdmin, fetchAll]);

  const profileById = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);
  const drawsByCall = useMemo(() => {
    const map = new Map<string, DrawRow[]>();
    for (const draw of draws) {
      const list = map.get(draw.capitalCallId) ?? [];
      list.push(draw);
      map.set(draw.capitalCallId, list);
    }
    return map;
  }, [draws]);

  const handleConfirmPayment = async (drawId: string) => {
    try {
      await api.post(`/capital-call-draws/${drawId}/confirm-payment`);
      toast.success('Payment confirmed');
      fetchAll();
    } catch (err) {
      console.error('Error confirming payment:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to confirm payment');
    }
  };

  const displayName = (userId: string) => {
    const p = profileById.get(userId);
    if (!p) return userId;
    const name = [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
    return name || p.email || userId;
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

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Capital Calls</h1>
          <p className="text-muted-foreground mt-2">
            Track drawdowns issued against pledged commitments and confirm investor payments.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/capital-calls/create">
            <Plus className="w-4 h-4 mr-2" />
            Create Capital Call
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading capital calls...</p>
        </div>
      ) : calls.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No capital calls issued yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {calls.map((call) => {
            const callDraws = drawsByCall.get(call.id) ?? [];
            const confirmedCount = callDraws.filter((d) => d.status === 'confirmed').length;
            return (
              <Card key={call.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{call.title}</CardTitle>
                      <CardDescription>
                        {call.offeringTitle} · Due {new Date(call.dueDate).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">
                      {confirmedCount} / {callDraws.length} confirmed
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {callDraws.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No investor obligations issued for this call.</p>
                  ) : (
                    <div className="space-y-2">
                      {callDraws.map((draw) => (
                        <div
                          key={draw.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-sm">{displayName(draw.userId)}</p>
                            <p className="text-xs text-muted-foreground">
                              Due {formatCurrency(Number(draw.amountDue))}
                              {draw.amountPaid && Number(draw.amountPaid) > 0
                                ? ` · Submitted ${formatCurrency(Number(draw.amountPaid))}`
                                : ''}
                              {draw.paymentReference ? ` · Ref: ${draw.paymentReference}` : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {drawStatusBadge(draw.status)}
                            {draw.status === 'payment_submitted' && (
                              <Button size="sm" onClick={() => handleConfirmPayment(draw.id)}>
                                Confirm Payment
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CapitalCallsManagement;
