import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Briefcase, TrendingUp, Clock, FileText } from 'lucide-react';
import { useMyInvestments, type MyInvestmentRow, type MyInvestmentDraw } from '@/hooks/useMyInvestments';
import { formatCurrency } from '@/utils/offeringHelpers';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

const statusBadge = (status: string) => {
  switch (status) {
    case 'fully_called':
      return <Badge className="bg-success/10 text-success border-success/20">Fully Deployed</Badge>;
    case 'partially_called':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Partially Deployed</Badge>;
    case 'pledged':
      return <Badge variant="outline">Pledged — Committed</Badge>;
    case 'pending_signature':
      return <Badge variant="secondary">Draft — Not Signed</Badge>;
    case 'cancelled':
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const InvestmentRow: React.FC<{ investment: MyInvestmentRow }> = ({ investment }) => (
  <div className="flex items-center justify-between p-4 border rounded-lg">
    <div>
      <p className="font-medium">{investment.offeringTitle}</p>
      <p className="text-sm text-muted-foreground">
        Committed {formatCurrency(Number(investment.investmentAmount))}
        {investment.entityType !== 'individual' && investment.entityLegalName
          ? ` · via ${investment.entityLegalName}`
          : ''}
      </p>
    </div>
    {statusBadge(investment.status)}
  </div>
);

const DrawRow: React.FC<{ draw: MyInvestmentDraw; onSubmitted: () => void }> = ({ draw, onSubmitted }) => {
  const [expanded, setExpanded] = useState(false);
  const [amount, setAmount] = useState(draw.amountDue);
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post(`/capital-call-draws/${draw.id}/submit-payment`, {
        amountPaid: amount,
        paymentReference: reference || undefined,
      });
      toast.success('Payment submitted — awaiting confirmation');
      setExpanded(false);
      onSubmitted();
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{formatCurrency(Number(draw.amountDue))} due</p>
          {draw.paymentReference && (
            <p className="text-xs text-muted-foreground">Ref: {draw.paymentReference}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {draw.status === 'confirmed' ? (
            <Badge className="bg-success/10 text-success border-success/20">Confirmed</Badge>
          ) : draw.status === 'payment_submitted' ? (
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Awaiting Confirmation</Badge>
          ) : (
            <>
              <Badge variant="outline">Due</Badge>
              <Button size="sm" variant="outline" onClick={() => setExpanded((v) => !v)}>
                Submit Payment
              </Button>
            </>
          )}
        </div>
      </div>
      {expanded && (
        <div className="space-y-2 pt-2 border-t">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Amount Paid</label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Payment Reference</label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <Button size="sm" className="w-full" onClick={handleSubmit} disabled={submitting || !amount}>
            {submitting ? 'Submitting...' : 'Confirm Submission'}
          </Button>
        </div>
      )}
    </div>
  );
};

export const MyInvestmentsPage: React.FC = () => {
  const {
    deployed,
    committed,
    draws,
    capitalDeployed,
    capitalCommitted,
    pendingCallsCount,
    loading,
    refetch,
  } = useMyInvestments();

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">My Investments</h1>
        <p className="text-muted-foreground">
          View all of your current and past pledges, key details, and portfolio overview.
        </p>
      </div>

      {/* Summary Cards — the Capital Deployed vs Capital Committed/Pending
          Calls split investors need to tell "money that's actually moved"
          from "money they've promised but haven't been asked to transfer". */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capital Deployed</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(capitalDeployed)}</div>
            <p className="text-xs text-muted-foreground">Confirmed, funded capital</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capital Committed / Pending Calls</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(capitalCommitted)}</div>
            <p className="text-xs text-muted-foreground">Pledged, not yet transferred</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capital Calls Awaiting Action</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCallsCount}</div>
            <p className="text-xs text-muted-foreground">Due or submitted, unconfirmed</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Capital Deployed</TabsTrigger>
          <TabsTrigger value="pending">Capital Committed</TabsTrigger>
          <TabsTrigger value="capital-calls">Capital Calls</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Capital Deployed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : deployed.length === 0 ? (
                <p className="text-muted-foreground">No capital deployed yet.</p>
              ) : (
                deployed.map((inv) => <InvestmentRow key={inv.id} investment={inv} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Capital Committed / Pending Calls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : committed.length === 0 ? (
                <p className="text-muted-foreground">No pledges pending a capital call.</p>
              ) : (
                committed.map((inv) => <InvestmentRow key={inv.id} investment={inv} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capital-calls">
          <Card>
            <CardHeader>
              <CardTitle>Capital Calls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : draws.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No capital calls issued against your pledges yet.</p>
                </div>
              ) : (
                draws.map((draw) => <DrawRow key={draw.id} draw={draw} onSubmitted={refetch} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
