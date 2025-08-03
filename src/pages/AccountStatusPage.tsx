import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Upload, 
  User, 
  MapPin, 
  CreditCard, 
  Shield, 
  FileText,
  Eye,
  ExternalLink
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { DocumentUploadModal } from '@/components/documents/DocumentUploadModal';

interface VerificationStatus {
  identity_verified: boolean;
  address_verified: boolean;
  financial_verified: boolean;
  pep_screened: boolean;
  sanctions_screened: boolean;
  kyc_completed: boolean;
  investor_classification: string | null;
  verification_level: string | null;
  overall_progress: number;
}

const VerificationCard: React.FC<{
  title: string;
  description: string;
  status: 'verified' | 'pending' | 'required' | 'expired';
  icon: React.ReactNode;
  action?: React.ReactNode;
  lastUpdate?: string;
}> = ({ title, description, status, icon, action, lastUpdate }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return {
          badge: <Badge className="bg-success/10 text-success border-success/20">Verified</Badge>,
          iconColor: 'text-success',
          borderColor: 'border-success/20'
        };
      case 'pending':
        return {
          badge: <Badge variant="secondary">Under Review</Badge>,
          iconColor: 'text-warning',
          borderColor: 'border-warning/20'
        };
      case 'expired':
        return {
          badge: <Badge variant="destructive">Expired</Badge>,
          iconColor: 'text-destructive',
          borderColor: 'border-destructive/20'
        };
      default:
        return {
          badge: <Badge variant="outline">Required</Badge>,
          iconColor: 'text-muted-foreground',
          borderColor: 'border-border'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Card className={`transition-all ${config.borderColor}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-background ${config.iconColor}`}>
              {icon}
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-sm">{description}</CardDescription>
            </div>
          </div>
          {config.badge}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {lastUpdate && (
          <p className="text-xs text-muted-foreground mb-3">
            Last updated: {new Date(lastUpdate).toLocaleDateString()}
          </p>
        )}
        {action}
      </CardContent>
    </Card>
  );
};

export const AccountStatusPage: React.FC = () => {
  const { user } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocumentCategory, setSelectedDocumentCategory] = useState<'identity' | 'address' | 'financial' | undefined>();

  useEffect(() => {
    fetchVerificationStatus();
  }, [user]);

  const fetchVerificationStatus = async () => {
    if (!user) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          is_accredited,
          kyc_verified,
          verification_status,
          investor_classification,
          is_pep,
          pep_screening_date,
          sanctions_screening_date,
          sanctions_clear
        `)
        .eq('id', user.id)
        .single();

      if (error) throw error;

      // Calculate verification status based on existing data
      const identity_verified = profile.verification_status === 'approved';
      const address_verified = profile.verification_status === 'approved';
      const financial_verified = profile.verification_status === 'approved' && profile.is_accredited;
      const pep_screened = profile.pep_screening_date !== null;
      const sanctions_screened = profile.sanctions_screening_date !== null;

      // Calculate overall progress
      const verifications = [
        identity_verified,
        address_verified,
        financial_verified,
        pep_screened,
        sanctions_screened
      ];
      
      const completedCount = verifications.filter(Boolean).length;
      const overall_progress = Math.round((completedCount / verifications.length) * 100);

      setVerificationStatus({
        identity_verified,
        address_verified,
        financial_verified,
        pep_screened,
        sanctions_screened,
        kyc_completed: profile.kyc_verified || false,
        investor_classification: profile.investor_classification,
        verification_level: profile.investor_classification === 'high_net_worth' || profile.investor_classification === 'sophisticated' ? 'enhanced' : 'basic',
        overall_progress
      });
    } catch (error) {
      console.error('Error fetching verification status:', error);
      toast({
        title: "Error",
        description: "Failed to load verification status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = (category: 'identity' | 'address' | 'financial') => {
    setSelectedDocumentCategory(category);
    setUploadModalOpen(true);
  };

  const handleUploadSuccess = () => {
    // Refresh verification status after successful upload
    fetchVerificationStatus();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Account Verification</h1>
        <p className="text-muted-foreground">
          Complete your verification to access all features and investment opportunities.
        </p>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Verification Progress
          </CardTitle>
          <CardDescription>
            Complete all verification steps to unlock premium features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Completion</span>
              <span className="text-sm text-muted-foreground">
                {verificationStatus?.overall_progress}%
              </span>
            </div>
            <Progress value={verificationStatus?.overall_progress} className="h-2" />
            
            {verificationStatus?.overall_progress === 100 ? (
              <Alert className="bg-success/10 border-success/20">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <AlertDescription className="text-success">
                  Your account is fully verified! You now have access to all investment opportunities.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Complete remaining verification steps to access premium investment opportunities and higher investment limits.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Verification Categories */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Identity Verification */}
        <VerificationCard
          title="Identity Verification"
          description="Verify your identity with government-issued ID"
          status={verificationStatus?.identity_verified ? 'verified' : 'required'}
          icon={<User className="h-5 w-5" />}
          action={
            !verificationStatus?.identity_verified && (
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => handleUploadClick('identity')}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload ID Document
              </Button>
            )
          }
        />

        {/* Address Verification */}
        <VerificationCard
          title="Address Verification"
          description="Confirm your residential address"
          status={verificationStatus?.address_verified ? 'verified' : 'required'}
          icon={<MapPin className="h-5 w-5" />}
          action={
            !verificationStatus?.address_verified && (
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full"
                onClick={() => handleUploadClick('address')}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Proof of Address
              </Button>
            )
          }
        />

        {/* Financial Verification */}
        <VerificationCard
          title="Financial Verification"
          description="Verify your financial status and source of wealth"
          status={verificationStatus?.financial_verified ? 'verified' : 'required'}
          icon={<CreditCard className="h-5 w-5" />}
          action={
            !verificationStatus?.financial_verified && (
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full"
                onClick={() => handleUploadClick('financial')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Complete Financial Profile
              </Button>
            )
          }
        />

        {/* PEP Screening */}
        <VerificationCard
          title="PEP Screening"
          description="Politically Exposed Person screening"
          status={verificationStatus?.pep_screened ? 'verified' : 'pending'}
          icon={<Shield className="h-5 w-5" />}
          action={
            verificationStatus?.pep_screened ? (
              <Button size="sm" variant="ghost" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                View Results
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Automated screening in progress
              </p>
            )
          }
        />

        {/* Sanctions Screening */}
        <VerificationCard
          title="Sanctions Screening"
          description="International sanctions list verification"
          status={verificationStatus?.sanctions_screened ? 'verified' : 'pending'}
          icon={<AlertCircle className="h-5 w-5" />}
          action={
            verificationStatus?.sanctions_screened ? (
              <Button size="sm" variant="ghost" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                View Results
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Automated screening in progress
              </p>
            )
          }
        />

        {/* Investor Classification */}
        <VerificationCard
          title="Investor Classification"
          description="Determine your investor status and eligibility"
          status={verificationStatus?.investor_classification ? 'verified' : 'required'}
          icon={<Clock className="h-5 w-5" />}
          action={
            verificationStatus?.investor_classification ? (
              <div className="space-y-2">
                <Badge variant="outline" className="w-full justify-center">
                  {verificationStatus.investor_classification}
                </Badge>
                <Button size="sm" variant="ghost" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Update Classification
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Complete Assessment
              </Button>
            )
          }
        />
      </div>

      {/* Compliance Information */}
      <Card>
        <CardHeader>
          <CardTitle>Regulatory Compliance</CardTitle>
          <CardDescription>
            Our verification process ensures compliance with UK FCA and South African FSCA regulations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                🇬🇧 UK FCA Compliance
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Sophisticated investor verification</li>
                <li>• High net worth assessment</li>
                <li>• Enhanced due diligence</li>
                <li>• Cooling-off period protection</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                🇿🇦 SA FSCA/FICA Compliance
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• FICA identity verification</li>
                <li>• Proof of address validation</li>
                <li>• Source of funds documentation</li>
                <li>• Risk-based due diligence</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        documentCategory={selectedDocumentCategory}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
};