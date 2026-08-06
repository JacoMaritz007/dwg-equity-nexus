import { api } from '@/lib/api-client';

// Raw camelCase shape as returned directly by /investments — unlike
// offering objects (see useInvestmentOfferings.ts), investments have no
// snake_case transform layer.
export interface PledgeInvestment {
  id: string;
  userId: string;
  offeringId: string;
  investmentAmount: string;
  status: string;
  entityType: 'individual' | 'trust' | 'corporate';
  entityLegalName: string | null;
  entityRegistrationNumber: string | null;
  riskAcknowledged: boolean;
  concentrationLimitConfirmed: boolean;
  signerLegalName: string | null;
  signedAt: string | null;
  agreementVersion: string | null;
  platformFeeAmount: string | null;
  totalExpectedCallAmount: string | null;
  createdAt: string;
}

export interface AgreementPreview {
  text: string;
  version: string;
}

export interface SignPledgePayload {
  entityType: 'individual' | 'trust' | 'corporate';
  entityLegalName?: string;
  entityRegistrationNumber?: string;
  riskAcknowledged: true;
  concentrationLimitConfirmed: true;
  signerLegalName: string;
}

// Resumes an existing pending_signature draft for this offering if one
// exists (e.g. the investor closed the wizard mid-flow), otherwise creates
// a fresh one. Mirrors /profiles/bootstrap's "idempotent, safe to call
// again" pattern for the same reason: nothing should ever create two
// pledges for the same investor/offering pair given the unique constraint.
export async function findOrCreatePledgeDraft(
  userId: string,
  offeringId: string,
  investmentAmount: number,
): Promise<PledgeInvestment> {
  const existing = await api.get<PledgeInvestment[]>('/investments');
  const draft = existing.find(
    (inv) => inv.offeringId === offeringId && inv.status === 'pending_signature',
  );
  if (draft) return draft;

  return api.post<PledgeInvestment>('/investments', {
    userId,
    offeringId,
    investmentAmount: String(investmentAmount),
  });
}

export function fetchAgreementPreview(investmentId: string): Promise<AgreementPreview> {
  return api.get<AgreementPreview>(`/investments/${investmentId}/agreement-preview`);
}

export function signPledge(investmentId: string, payload: SignPledgePayload): Promise<PledgeInvestment> {
  return api.post<PledgeInvestment>(`/investments/${investmentId}/sign`, payload);
}
