import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Shield, ShieldAlert, User, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { AdminScreeningModal } from '@/components/admin/AdminScreeningModal';
import { formatCurrency } from '@/utils/offeringHelpers';

interface ComplianceProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  amlQuestionnaireCompletedAt: string | null;
  isPep: boolean | null;
  pepDetails: string | null;
  riskRating: string | null;
  sourceOfWealth: string[] | null;
  annualIncome: string | null;
  netWorth: string | null;
  pepScreened: boolean | null;
  sanctionsScreened: boolean | null;
}

const SOURCE_OF_WEALTH_LABELS: Record<string, string> = {
  employment: 'Employment',
  business_ownership: 'Business Ownership',
  inheritance: 'Inheritance',
  property_sale: 'Sale of Property',
  investment_gains: 'Investment Gains',
  pension: 'Pension',
  gift: 'Gift',
  other: 'Other',
};

const AdminCompliance: React.FC = () => {
  const { hasRole } = usePermissions();
  const isAdmin = useMemo(() => hasRole('admin'), [hasRole]);

  const [profiles, setProfiles] = useState<ComplianceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [screeningModal, setScreeningModal] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
    userEmail: string;
    screeningType: 'pep' | 'sanctions';
  }>({ isOpen: false, userId: '', userName: '', userEmail: '', screeningType: 'pep' });

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      const all = await api.get<ComplianceProfile[]>('/profiles');
      setProfiles(all);
    } catch (err) {
      console.error('Error fetching compliance queue:', err);
      toast.error('Failed to load compliance queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchQueue();
  }, [isAdmin, fetchQueue]);

  // Profiles that have submitted the AML self-declaration but are still
  // missing PEP and/or sanctions screening — profiles.pepScreened/
  // sanctionsScreened are flipped by compliance.ts's /confirm-upload route,
  // so these flags are the authoritative source, not a re-derivation from
  // raw compliance_screening_documents rows.
  const queue = useMemo(
    () =>
      profiles
        .filter((p) => p.amlQuestionnaireCompletedAt && (!p.pepScreened || !p.sanctionsScreened))
        .sort((a, b) => (a.amlQuestionnaireCompletedAt ?? '').localeCompare(b.amlQuestionnaireCompletedAt ?? '')),
    [profiles],
  );

  const pepFlaggedCount = queue.filter((p) => p.isPep).length;

  const displayName = (p: ComplianceProfile) => {
    const name = [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
    return name || p.email || 'Unknown';
  };

  const openScreening = (p: ComplianceProfile, screeningType: 'pep' | 'sanctions') => {
    setScreeningModal({
      isOpen: true,
      userId: p.id,
      userName: displayName(p),
      userEmail: p.email || '',
      screeningType,
    });
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground mt-2">You don't have admin permissions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Compliance Queue</h1>
        <p className="text-muted-foreground mt-2">
          Investors who have submitted their AML declaration and are awaiting PEP or
          sanctions screening (FICA due diligence).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Screening</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{queue.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged PEP (EDD required)</CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{pepFlaggedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Declarations</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profiles.filter((p) => p.amlQuestionnaireCompletedAt).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Review</CardTitle>
          <CardDescription>Oldest submissions first</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading queue...</p>
            </div>
          ) : queue.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No declarations awaiting screening</p>
            </div>
          ) : (
            <div className="space-y-4">
              {queue.map((p) => (
                <div
                  key={p.id}
                  className={`border rounded-lg p-4 hover:bg-muted/50 transition-colors ${
                    p.isPep ? 'border-destructive/40' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{displayName(p)}</span>
                        <span className="text-sm text-muted-foreground">{p.email}</span>
                        {p.isPep && (
                          <Badge variant="destructive">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            PEP — EDD required
                          </Badge>
                        )}
                        {p.riskRating && (
                          <Badge variant="outline" className="capitalize">
                            {p.riskRating} risk
                          </Badge>
                        )}
                      </div>

                      <div className="text-sm text-muted-foreground">
                        Submitted{' '}
                        {p.amlQuestionnaireCompletedAt
                          ? new Date(p.amlQuestionnaireCompletedAt).toLocaleDateString()
                          : '—'}
                        {!p.pepScreened && ' · PEP screening pending'}
                        {!p.sanctionsScreened && ' · Sanctions screening pending'}
                      </div>

                      {p.sourceOfWealth && p.sourceOfWealth.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {p.sourceOfWealth.map((s) => (
                            <Badge key={s} variant="secondary" className="text-xs">
                              {SOURCE_OF_WEALTH_LABELS[s] ?? s}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="text-sm text-muted-foreground">
                        Annual income: {p.annualIncome ? formatCurrency(Number(p.annualIncome)) : '—'} ·
                        {' '}Net worth: {p.netWorth ? formatCurrency(Number(p.netWorth)) : '—'}
                      </div>

                      {p.isPep && p.pepDetails && (
                        <div className="p-2 bg-muted rounded text-sm">
                          <strong>PEP details:</strong> {p.pepDetails}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {!p.pepScreened && (
                        <Button size="sm" variant="outline" onClick={() => openScreening(p, 'pep')}>
                          PEP Screen
                        </Button>
                      )}
                      {!p.sanctionsScreened && (
                        <Button size="sm" variant="outline" onClick={() => openScreening(p, 'sanctions')}>
                          Sanctions Screen
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AdminScreeningModal
        open={screeningModal.isOpen}
        onOpenChange={(open) => setScreeningModal((prev) => ({ ...prev, isOpen: open }))}
        userId={screeningModal.userId}
        userName={screeningModal.userName}
        userEmail={screeningModal.userEmail}
        screeningType={screeningModal.screeningType}
        onScreeningComplete={() => {
          fetchQueue();
        }}
      />
    </div>
  );
};

export default AdminCompliance;
