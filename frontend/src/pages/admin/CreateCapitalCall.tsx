import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { useInvestmentOfferings } from '@/hooks/useInvestmentOfferings';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const CreateCapitalCall: React.FC = () => {
  const { canAccessAdmin } = usePermissions();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { offerings, loading: loadingOfferings, fetchOfferings } = useInvestmentOfferings();

  const [offeringId, setOfferingId] = useState(searchParams.get('offering') || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amountPerShare, setAmountPerShare] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [callPercentage, setCallPercentage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOfferings({ status: 'active' });
  }, [fetchOfferings]);

  const activeOfferings = offerings.filter((o) => o.status === 'active');

  const isValid =
    offeringId && title.trim() && amountPerShare.trim() && dueDate && Number(callPercentage) > 0 &&
    Number(callPercentage) <= 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setSubmitting(true);
    try {
      const call = await api.post<{ id: string }>(`/offerings/${offeringId}/capital-calls`, {
        title,
        description: description || undefined,
        amountPerShare,
        dueDate,
      });

      const draws = await api.post<unknown[]>(`/capital-calls/${call.id}/issue-draws`, {
        callPercentage: Number(callPercentage),
      });

      toast.success(`Capital call created — ${draws.length} investor obligation(s) issued`);
      navigate('/admin/capital-calls');
    } catch (error) {
      console.error('Error creating capital call:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create capital call');
    } finally {
      setSubmitting(false);
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

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Capital Call</h1>
        <p className="text-muted-foreground mt-2">
          Issue a capital call against a raise and draw down a percentage of every investor's pledged
          commitment.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Call Details</CardTitle>
          <CardDescription>These terms are shown to investors alongside their obligation.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="offering">Offering *</Label>
              <Select value={offeringId} onValueChange={setOfferingId} disabled={loadingOfferings}>
                <SelectTrigger id="offering">
                  <SelectValue placeholder="Select an offering" />
                </SelectTrigger>
                <SelectContent>
                  {activeOfferings.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. First Drawdown — Q1" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional context shown to investors"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amountPerShare">Amount Per Share (R) *</Label>
                <Input
                  id="amountPerShare"
                  type="number"
                  value={amountPerShare}
                  onChange={(e) => setAmountPerShare(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="callPercentage">Draw Percentage of Committed Capital (%) *</Label>
              <Input
                id="callPercentage"
                type="number"
                min={1}
                max={100}
                value={callPercentage}
                onChange={(e) => setCallPercentage(e.target.value)}
                placeholder="e.g. 25"
              />
              <p className="text-xs text-muted-foreground">
                Every investor with a pledged (or partially-called) commitment in this offering will owe
                this percentage of what they committed.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={!isValid || submitting}>
              {submitting ? 'Issuing...' : 'Create Call & Issue Draws'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateCapitalCall;
