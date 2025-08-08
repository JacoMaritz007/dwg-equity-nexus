import React, { useState, useEffect } from 'react';
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
  Clock
} from 'lucide-react';
import { InvestmentOfferingWithDetails } from '@/types/investment';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InvestmentProcessModalProps {
  offering: InvestmentOfferingWithDetails;
  isOpen: boolean;
  onClose: () => void;
}

type ProcessStep = 'verification' | 'diligence' | 'invest' | 'esign' | 'fund';

interface UserProfile {
  kyc_verified: boolean;
  identity_verified: boolean;
  address_verified: boolean;
  financial_verified: boolean;
  is_accredited: boolean;
}

export const InvestmentProcessModal: React.FC<InvestmentProcessModalProps> = ({
  offering,
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<ProcessStep>('verification');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [investmentAmount, setInvestmentAmount] = useState<number>(offering.minimum_investment || 0);

  useEffect(() => {
    if (isOpen && user) {
      fetchUserProfile();
    }
  }, [isOpen, user]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('kyc_verified, identity_verified, address_verified, financial_verified, is_accredited')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setUserProfile(data);

      // Determine starting step based on verification status
      if (data?.kyc_verified && data?.identity_verified) {
        setCurrentStep('diligence');
      } else {
        setCurrentStep('verification');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to fetch user profile');
    } finally {
      setLoading(false);
    }
  };

  const createInvestmentApplication = async () => {
    try {
      // For now, create a user investment record directly
      const { data, error } = await supabase
        .from('user_investments')
        .insert({
          user_id: user?.id,
          offering_id: offering.id,
          investment_amount: investmentAmount,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial transaction record
      await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          investment_id: data.id,
          type: 'contribution',
          amount: investmentAmount,
          description: `Investment application for ${offering.title}`
        });

      toast.success('Investment application created successfully');
      return data;
    } catch (error) {
      console.error('Error creating investment application:', error);
      toast.error('Failed to create investment application');
      throw error;
    }
  };

  const isVerificationComplete = userProfile?.kyc_verified && 
                                 userProfile?.identity_verified;

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
        {!isVerificationComplete ? (
          <>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You must complete account verification before investing. This ensures compliance with regulatory requirements.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span>Identity Verification</span>
                </div>
                <Badge variant={userProfile?.identity_verified ? "default" : "outline"}>
                  {userProfile?.identity_verified ? "Verified" : "Pending"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span>KYC Verification</span>
                </div>
                <Badge variant={userProfile?.kyc_verified ? "default" : "outline"}>
                  {userProfile?.kyc_verified ? "Verified" : "Pending"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <span>Accredited Investor Status</span>
                </div>
                <Badge variant={userProfile?.is_accredited ? "default" : "outline"}>
                  {userProfile?.is_accredited ? "Verified" : "Pending"}
                </Badge>
              </div>
            </div>
            
            <Button 
              className="w-full" 
              onClick={() => window.open('/account-status', '_blank')}
            >
              Complete Verification Process
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-success">
              <CheckCircle className="h-5 w-5" />
              <span>Verification Complete</span>
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
                    <p className="text-lg font-bold">${offering.minimum_investment?.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Maximum Investment</label>
                    <p className="text-lg font-bold">${offering.maximum_investment?.toLocaleString()}</p>
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
                    Investment Amount: ${investmentAmount.toLocaleString()}
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
                      <span className="font-medium">${investmentAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Processing Fee:</span>
                      <span className="font-medium">$0</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-medium">
                      <span>Total Due:</span>
                      <span>${investmentAmount.toLocaleString()}</span>
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