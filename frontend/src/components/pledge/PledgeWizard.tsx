import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Stepper, type StepperStep } from '@/components/ui/stepper';
import {
  AlertTriangle,
  CheckCircle,
  FileText,
  Landmark,
  ShieldCheck,
  PenTool,
  PartyPopper,
  ArrowRight,
  User,
  Shield,
  MapPin,
  DollarSign,
} from 'lucide-react';
import { InvestmentOfferingWithDetails } from '@/types/investment';
import { useAuth } from '@/contexts/AuthContext';
import { useVerificationStatus } from '@/hooks/useVerificationStatus';
import { useDocuments } from '@/hooks/useDocuments';
import {
  findOrCreatePledgeDraft,
  fetchAgreementPreview,
  signPledge,
  type PledgeInvestment,
} from '@/hooks/usePledgeDraft';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/offeringHelpers';

interface PledgeWizardProps {
  offering: InvestmentOfferingWithDetails;
  isOpen: boolean;
  onClose: () => void;
}

type WizardStep = 'verification' | 'sizing' | 'entity' | 'suitability' | 'sign' | 'confirmation';

const STEPS: StepperStep[] = [
  { id: 'verification', title: 'Verification' },
  { id: 'sizing', title: 'Amount' },
  { id: 'entity', title: 'Profile' },
  { id: 'suitability', title: 'Risk' },
  { id: 'sign', title: 'Sign' },
  { id: 'confirmation', title: 'Done' },
];

// Fee calculation mirrors backend/src/routes/investments.ts's POST /investments
// exactly — this is a live preview only, the server independently computes
// and snapshots the authoritative figures when the draft is created, never
// trusting a client-supplied number.
function calculateFees(offering: InvestmentOfferingWithDetails, amount: number) {
  const feePct =
    ((offering.base_fee || 0) + (offering.structure_fee || 0) + (offering.marketing_sales_fee || 0)) / 100;
  const platformFee = amount * feePct;
  return { platformFee, totalExpectedCall: amount + platformFee };
}

export const PledgeWizard: React.FC<PledgeWizardProps> = ({ offering, isOpen, onClose }) => {
  const { user } = useAuth();
  const { status: verificationStatus, loading } = useVerificationStatus();
  const { getSignedUrl } = useDocuments();

  const [currentStep, setCurrentStep] = useState<WizardStep>('verification');
  const [investmentAmount, setInvestmentAmount] = useState<number>(offering.minimum_investment || 0);
  const [draft, setDraft] = useState<PledgeInvestment | null>(null);
  const [creatingDraft, setCreatingDraft] = useState(false);

  const [entityType, setEntityType] = useState<'individual' | 'trust' | 'corporate'>('individual');
  const [entityLegalName, setEntityLegalName] = useState('');
  const [entityRegistrationNumber, setEntityRegistrationNumber] = useState('');

  const [riskAcknowledged, setRiskAcknowledged] = useState(false);
  const [concentrationLimitConfirmed, setConcentrationLimitConfirmed] = useState(false);

  const [agreementText, setAgreementText] = useState('');
  const [loadingAgreement, setLoadingAgreement] = useState(false);
  const [signerLegalName, setSignerLegalName] = useState('');
  const [signing, setSigning] = useState(false);

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const fees = calculateFees(offering, investmentAmount);

  useEffect(() => {
    if (currentStep !== 'sign' || !draft) return;
    setLoadingAgreement(true);
    fetchAgreementPreview(draft.id)
      .then((preview) => setAgreementText(preview.text))
      .catch(() => toast.error('Could not load the subscription agreement'))
      .finally(() => setLoadingAgreement(false));
  }, [currentStep, draft]);

  const handleContinueFromSizing = async () => {
    if (!user?.id) return;
    setCreatingDraft(true);
    try {
      const created = await findOrCreatePledgeDraft(user.id, offering.id, investmentAmount);
      setDraft(created);
      setCurrentStep('entity');
    } catch (error) {
      console.error('Error creating pledge draft:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start pledge');
    } finally {
      setCreatingDraft(false);
    }
  };

  const handleSign = async () => {
    if (!draft || !signerLegalName.trim()) return;
    setSigning(true);
    try {
      const signed = await signPledge(draft.id, {
        entityType,
        entityLegalName: entityType !== 'individual' ? entityLegalName : undefined,
        entityRegistrationNumber: entityType !== 'individual' ? entityRegistrationNumber : undefined,
        riskAcknowledged: true,
        concentrationLimitConfirmed: true,
        signerLegalName: signerLegalName.trim(),
      });
      setDraft(signed);
      toast.success('Pledge submitted');
      setCurrentStep('confirmation');
    } catch (error) {
      console.error('Error signing pledge:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit pledge');
    } finally {
      setSigning(false);
    }
  };

  const renderVerificationStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Account Verification Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!verificationStatus?.can_invest ? (
          <>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You must complete all verification steps before pledging. This ensures compliance with
                regulatory requirements.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Overall Progress</span>
                <span>{verificationStatus?.overall_progress || 0}%</span>
              </div>
              <Progress value={verificationStatus?.overall_progress || 0} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span>Identity Verification</span>
                </div>
                <Badge variant={verificationStatus?.identity_verified ? 'default' : 'outline'}>
                  {verificationStatus?.identity_verified ? 'Complete' : 'Required'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span>Address Verification</span>
                </div>
                <Badge variant={verificationStatus?.address_verified ? 'default' : 'outline'}>
                  {verificationStatus?.address_verified ? 'Complete' : 'Required'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <span>Financial Verification</span>
                </div>
                <Badge variant={verificationStatus?.financial_verified ? 'default' : 'outline'}>
                  {verificationStatus?.financial_verified ? 'Complete' : 'Required'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <span>PEP Screening</span>
                </div>
                <Badge variant={verificationStatus?.pep_screened ? 'default' : 'outline'}>
                  {verificationStatus?.pep_screened ? 'Complete' : 'Required'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                  <span>Sanctions Screening</span>
                </div>
                <Badge variant={verificationStatus?.sanctions_screened ? 'default' : 'outline'}>
                  {verificationStatus?.sanctions_screened ? 'Complete' : 'Required'}
                </Badge>
              </div>
            </div>

            <Button asChild className="w-full">
              <Link to="/account-status">
                <FileText className="w-4 h-4 mr-2" />
                Complete Verification Process
              </Link>
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-success">
              <CheckCircle className="h-5 w-5" />
              <span>Verification Complete — Ready to Pledge</span>
            </div>
            <Button className="w-full" onClick={() => setCurrentStep('sizing')}>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderSizingStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Landmark className="h-5 w-5" />
          Commitment Amount
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Minimum</label>
            <p className="text-lg font-bold">{formatCurrency(offering.minimum_investment || 0)}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Maximum</label>
            <p className="text-lg font-bold">{formatCurrency(offering.maximum_investment || 0)}</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Amount You Wish to Commit</label>
          <input
            type="number"
            value={investmentAmount}
            onChange={(e) => setInvestmentAmount(Number(e.target.value))}
            min={offering.minimum_investment || 0}
            max={offering.maximum_investment || undefined}
            className="w-full p-3 border rounded-lg"
            placeholder="Enter commitment amount"
          />
        </div>

        <div className="p-4 bg-muted rounded-lg space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Capital Committed:</span>
            <span className="font-medium">{formatCurrency(investmentAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Platform Fee:</span>
            <span className="font-medium">{formatCurrency(fees.platformFee)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-medium">
            <span>Total Expected Call:</span>
            <span>{formatCurrency(fees.totalExpectedCall)}</span>
          </div>
        </div>

        {offering.offering_documents && offering.offering_documents.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Deal Documents</h4>
            {offering.offering_documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">{doc.title}</p>
                  <p className="text-xs text-muted-foreground">{doc.document_category}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const url = await getSignedUrl(doc.file_path, 'offering-documents');
                    if (url) window.open(url, '_blank', 'noopener,noreferrer');
                    else toast.error('Could not open document');
                  }}
                >
                  Review
                </Button>
              </div>
            ))}
          </div>
        )}

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You are not transferring funds today. You are sizing a commitment you'll formally sign in
            the next steps.
          </AlertDescription>
        </Alert>

        <Button
          className="w-full"
          onClick={handleContinueFromSizing}
          disabled={
            creatingDraft ||
            investmentAmount < (offering.minimum_investment || 0) ||
            (offering.maximum_investment ? investmentAmount > offering.maximum_investment : false)
          }
        >
          {creatingDraft ? 'Starting...' : 'Continue'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );

  const renderEntityStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Who Is Pledging?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={entityType} onValueChange={(v) => setEntityType(v as typeof entityType)}>
          <div className="flex items-center gap-2 p-3 border rounded-lg">
            <RadioGroupItem value="individual" id="entity-individual" />
            <Label htmlFor="entity-individual" className="font-normal cursor-pointer flex-1">
              Individual
            </Label>
          </div>
          <div className="flex items-center gap-2 p-3 border rounded-lg">
            <RadioGroupItem value="trust" id="entity-trust" />
            <Label htmlFor="entity-trust" className="font-normal cursor-pointer flex-1">
              Trust
            </Label>
          </div>
          <div className="flex items-center gap-2 p-3 border rounded-lg">
            <RadioGroupItem value="corporate" id="entity-corporate" />
            <Label htmlFor="entity-corporate" className="font-normal cursor-pointer flex-1">
              Corporate Entity
            </Label>
          </div>
        </RadioGroup>

        {entityType !== 'individual' && (
          <div className="space-y-3 pt-2">
            <div className="space-y-2">
              <Label htmlFor="entityLegalName">Legal Name *</Label>
              <Input
                id="entityLegalName"
                value={entityLegalName}
                onChange={(e) => setEntityLegalName(e.target.value)}
                placeholder={entityType === 'trust' ? 'e.g. The Smith Family Trust' : 'e.g. Acme Holdings (Pty) Ltd'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entityRegistrationNumber">Registration Number *</Label>
              <Input
                id="entityRegistrationNumber"
                value={entityRegistrationNumber}
                onChange={(e) => setEntityRegistrationNumber(e.target.value)}
              />
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Your KYC/AML verification remains under your individual profile regardless of which entity
          pledges — this selection determines who the pledge is legally made on behalf of.
        </p>

        <Button
          className="w-full"
          onClick={() => setCurrentStep('suitability')}
          disabled={entityType !== 'individual' && (!entityLegalName.trim() || !entityRegistrationNumber.trim())}
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );

  const renderSuitabilityStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Suitability &amp; Risk Acknowledgment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 p-3 border rounded-lg">
          <Checkbox
            id="riskAck"
            checked={riskAcknowledged}
            onCheckedChange={(checked) => setRiskAcknowledged(checked === true)}
          />
          <Label htmlFor="riskAck" className="text-sm font-normal cursor-pointer">
            I acknowledge the risks associated with this asset class, including illiquidity and the
            potential loss of some or all of my committed capital.
          </Label>
        </div>
        <div className="flex items-start gap-2 p-3 border rounded-lg">
          <Checkbox
            id="concentrationAck"
            checked={concentrationLimitConfirmed}
            onCheckedChange={(checked) => setConcentrationLimitConfirmed(checked === true)}
          />
          <Label htmlFor="concentrationAck" className="text-sm font-normal cursor-pointer">
            I confirm this commitment is consistent with my income and net worth, and does not exceed
            any applicable regulatory concentration limits.
          </Label>
        </div>

        <Button
          className="w-full"
          onClick={() => setCurrentStep('sign')}
          disabled={!riskAcknowledged || !concentrationLimitConfirmed}
        >
          Continue to Signature
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );

  const renderSignStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenTool className="h-5 w-5" />
          Review &amp; Sign
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You are not transferring funds today. You are signing a legally binding commitment to
            transfer funds when this deal issues a formal Capital Call.
          </AlertDescription>
        </Alert>

        <div className="border rounded-lg p-4 max-h-64 overflow-y-auto bg-muted/30 whitespace-pre-wrap text-sm font-mono">
          {loadingAgreement ? 'Loading agreement...' : agreementText}
        </div>

        <div className="space-y-2">
          <Label htmlFor="signerLegalName">Type your full legal name to sign *</Label>
          <Input
            id="signerLegalName"
            value={signerLegalName}
            onChange={(e) => setSignerLegalName(e.target.value)}
            placeholder="Full legal name"
          />
        </div>

        <Button className="w-full" onClick={handleSign} disabled={signing || !signerLegalName.trim()}>
          {signing ? 'Submitting...' : 'Submit Pledge'}
        </Button>
      </CardContent>
    </Card>
  );

  const renderConfirmationStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PartyPopper className="h-5 w-5" />
          Pledge Secured
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted rounded-lg space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Capital Committed:</span>
            <span className="font-medium">{formatCurrency(investmentAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Platform Fee:</span>
            <span className="font-medium">{formatCurrency(fees.platformFee)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-medium">
            <span>Total Expected Call:</span>
            <span>{formatCurrency(fees.totalExpectedCall)}</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Your pledge is secured. No funds have moved. You'll receive a Capital Call notice when this
          deal is ready to draw down committed capital — track it any time under "My Investments."
        </p>
        <Button className="w-full" onClick={onClose}>
          Done
        </Button>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pledge to {offering.title}</DialogTitle>
          <Stepper steps={STEPS} currentIndex={currentStepIndex} />
        </DialogHeader>

        <div className="space-y-6">
          {currentStep === 'verification' && renderVerificationStep()}
          {currentStep === 'sizing' && renderSizingStep()}
          {currentStep === 'entity' && renderEntityStep()}
          {currentStep === 'suitability' && renderSuitabilityStep()}
          {currentStep === 'sign' && renderSignStep()}
          {currentStep === 'confirmation' && renderConfirmationStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
