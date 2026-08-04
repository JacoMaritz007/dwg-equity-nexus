import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowRight,
  Shield,
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface VerificationStatusCardProps {
  overallProgress: number;
  identityVerified: boolean;
  addressVerified: boolean;
  financialVerified: boolean;
  kycCompleted: boolean;
  isAccredited: boolean;
  className?: string;
}

export const VerificationStatusCard: React.FC<VerificationStatusCardProps> = ({
  overallProgress,
  identityVerified,
  addressVerified,
  financialVerified,
  kycCompleted,
  isAccredited,
  className
}) => {
  const getVerificationItems = () => [
    { label: 'Identity Verification', completed: identityVerified },
    { label: 'Address Verification', completed: addressVerified },
    { label: 'Financial Verification', completed: financialVerified },
    { label: 'KYC Completed', completed: kycCompleted },
  ];

  const verificationItems = getVerificationItems();
  const completedItems = verificationItems.filter(item => item.completed).length;
  const nextIncompleteItem = verificationItems.find(item => !item.completed);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Account Verification Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Verification Progress</span>
            <span className="text-sm text-muted-foreground">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
          
          {overallProgress === 100 ? (
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Fully Verified</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-warning">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                {completedItems} of {verificationItems.length} steps completed
              </span>
            </div>
          )}
        </div>

        {/* Verification Steps */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Verification Steps</h4>
          <div className="grid gap-2">
            {verificationItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  {item.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">{item.label}</span>
                </div>
                <Badge variant={item.completed ? 'default' : 'secondary'} className="text-xs">
                  {item.completed ? 'Complete' : 'Pending'}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Accredited Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Accredited Investor Status</span>
            <Badge variant={isAccredited ? 'default' : 'secondary'} className="text-xs">
              {isAccredited ? 'Verified' : 'Pending'}
            </Badge>
          </div>
          
          {!isAccredited && (
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning" />
                <p className="text-sm text-warning font-medium">
                  Complete verification to access premium opportunities
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {nextIncompleteItem && (
            <Button asChild size="sm" className="w-full">
              <Link to="/account-status">
                Continue {nextIncompleteItem.label}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          )}
          
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link to="/account-status">
              <Shield className="h-4 w-4 mr-2" />
              View Full Status
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};