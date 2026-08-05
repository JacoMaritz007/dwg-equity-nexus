import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  DollarSign, 
  PenTool, 
  CreditCard,
  ArrowRight,
  User,
  Shield,
  Clock,
  MapPin
} from 'lucide-react';
import { InvestmentOfferingWithDetails } from '@/types/investment';
import { useAuth } from '@/contexts/AuthContext';
import { useVerificationStatus } from '@/hooks/useVerificationStatus';
import { api } from '@/lib/api-client';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/offeringHelpers';

interface InvestmentProcessModalProps {
  offering: InvestmentOfferingWithDetails;
  isOpen: boolean;
  onClose: () => void;
}

type ProcessStep = 'verification' | 'diligence' | 'invest' | 'esign' | 'fund';

export const InvestmentProcessModal: React.FC<InvestmentProcessModalProps> = ({
  offering,
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const { status: verificationStatus, loading } = useVerificationStatus();
  const [currentStep, setCurrentStep] = useState<ProcessStep>('verification');
  const [investmentAmount, setInvestmentAmount] = useState<number>(offering.minimum_investment || 0);

  const createInvestmentApplication = async () => {
    if (!verificationStatus?.can_invest) {
      toast.error('Please complete verification before investing');
      return;
    }

    try {
      // Create user investment record
      const data = await api.post<{ id: string }>('/investments', {
        userId: user?.id,
        offeringId: offering.id,
        investmentAmount: String(investmentAmount),
        status: 'pending',
      });

      // Create initial transaction record. Admin-only on the backend (see
      // useTransactions.ts) — this call will 403 for a non-admin actor,
      // same outcome as the original: there was never a user-facing
      // transactions INSERT RLS policy either, so this insert would have
      // failed under RLS too. Left in place rather than silently dropped,
      // since fixing it for real means deciding who/what should actually
      // record the contribution transaction (likely a payment-webhook
      // driven backend action once funding is wired up for real, not this
      // modal directly) — a product decision, not a mechanical port.
      await api.post('/transactions', {
        userId: user?.id,
        investmentId: data.id,
        type: 'contribution',
        amount: String(investmentAmount),
        description: `Investment application for ${offering.title}`,
      }).catch((err) => {
        console.warn('Transaction record not created (expected for non-admin users):', err);
      });

      toast.success('Investment application created successfully');
      return data;
    } catch (error) {
      console.error('Error creating investment application:', error);
      toast.error('Failed to create investment application');
      throw error;
    }
  };

  const steps = [
    { id: 'verification', title: 'Verification', icon: Shield, description: 'Verify your identity and eligibility' },
    { id: 'diligence', title: 'Due Diligence', icon: FileText, description: 'Review investment documents' },
    { id: 'invest', title: 'Investment Details', icon: DollarSign, description: 'Specify investment amount' },
    { id: 'esign', title: 'Sign Documents', icon: PenTool, description: 'Execute subscription agreement' },
    { id: 'fund', title: 'Fund Investment', icon: CreditCard, description: 'Complete payment process' }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

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
                You must complete all verification steps before investing. This ensures compliance with regulatory requirements.
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
                <Badge variant={verificationStatus?.identity_verified ? "default" : "outline"}>
                  {verificationStatus?.identity_verified ? "Complete" : "Required"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span>Address Verification</span>
                </div>
                <Badge variant={verificationStatus?.address_verified ? "default" : "outline"}>
                  {verificationStatus?.address_verified ? "Complete" : "Required"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <span>Financial Verification</span>
                </div>
                <Badge variant={verificationStatus?.financial_verified ? "default" : "outline"}>
                  {verificationStatus?.financial_verified ? "Complete" : "Required"}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <span>PEP Screening</span>
                </div>
                <Badge variant={verificationStatus?.pep_screened ? "default" : "outline"}>
                  {verificationStatus?.pep_screened ? "Complete" : "Required"}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                  <span>Sanctions Screening</span>
                </div>
                <Badge variant={verificationStatus?.sanctions_screened ? "default" : "outline"}>
                  {verificationStatus?.sanctions_screened ? "Complete" : "Required"}
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
              <span>Verification Complete - Ready to Invest</span>
            </div>
            <Button 
              className="w-full" 
              onClick={() => setCurrentStep('diligence')}
            >
              Continue to Due Diligence
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </>
        )}
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
          <DialogTitle>Investment Process - {offering.title}</DialogTitle>
          <div className="space-y-2">
            <Progress value={progressPercentage} className="w-full" />
            <div className="flex justify-between text-xs text-muted-foreground">
              {steps.map((step, index) => (
                <span key={step.id} className={index <= currentStepIndex ? "text-primary" : ""}>
                  {step.title}
                </span>
              ))}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Step Content */}
          {currentStep === 'verification' && renderVerificationStep()}
          
          {currentStep === 'diligence' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Due Diligence Review
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Please review all investment documents carefully before proceeding.
                </p>
                
                {offering.offering_documents?.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{doc.title}</p>
                      <p className="text-sm text-muted-foreground">{doc.document_category}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Review
                    </Button>
                  </div>
                ))}
                
                <Button 
                  className="w-full" 
                  onClick={() => setCurrentStep('invest')}
                >
                  Continue to Investment Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {currentStep === 'invest' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Investment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Minimum Investment</label>
                    <p className="text-lg font-bold">{formatCurrency(offering.minimum_investment || 0)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Maximum Investment</label>
                    <p className="text-lg font-bold">{formatCurrency(offering.maximum_investment || 0)}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Investment Amount</label>
                  <input 
                    type="number"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                    min={offering.minimum_investment || 0}
                    max={offering.maximum_investment || undefined}
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter investment amount"
                  />
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={async () => {
                    try {
                      await createInvestmentApplication();
                      setCurrentStep('esign');
                    } catch (error) {
                      // Error already handled in createInvestmentApplication
                    }
                  }}
                  disabled={investmentAmount < (offering.minimum_investment || 0)}
                >
                  Proceed to Document Signing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {currentStep === 'esign' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PenTool className="h-5 w-5" />
                  Electronic Signature
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Sign the subscription agreement and related documents to complete your investment application.
                </p>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Subscription Agreement</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Investment Amount: {formatCurrency(investmentAmount)}
                  </p>
                  <Button variant="outline" className="w-full">
                    <PenTool className="mr-2 h-4 w-4" />
                    Sign Document
                  </Button>
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={() => setCurrentStep('fund')}
                >
                  Continue to Funding
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {currentStep === 'fund' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Fund Your Investment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Investment Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Investment Amount:</span>
                      <span className="font-medium">{formatCurrency(investmentAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Processing Fee:</span>
                      <span className="font-medium">{formatCurrency(0)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-medium">
                      <span>Total Due:</span>
                      <span>{formatCurrency(investmentAmount)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium">Wire Transfer Instructions</h4>
                  <div className="p-3 border rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Bank Name:</span>
                      <span>Investment Bank LLC</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Account Number:</span>
                      <span>*****1234</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Routing Number:</span>
                      <span>021000021</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Reference:</span>
                      <span>INV-{offering.id.slice(0, 8)}</span>
                    </div>
                  </div>
                </div>
                
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Wire transfers typically take 1-3 business days to process. You'll receive a confirmation once your funds are received.
                  </AlertDescription>
                </Alert>
                
                <Button className="w-full" onClick={onClose}>
                  Complete Investment Process
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};