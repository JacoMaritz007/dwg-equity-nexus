import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  DollarSign, 
  Briefcase, 
  AlertCircle, 
  ArrowRight,
  Building,
  Users,
  Calendar,
  Target
} from 'lucide-react';

const quickStats = [
  {
    title: 'Total Invested',
    value: '$425,000',
    change: '+12.5%',
    changeType: 'positive' as const,
    icon: DollarSign,
  },
  {
    title: 'Active Investments',
    value: '8',
    change: '+2',
    changeType: 'positive' as const,
    icon: Briefcase,
  },
  {
    title: 'Total Returns',
    value: '$52,750',
    change: '+8.2%',
    changeType: 'positive' as const,
    icon: TrendingUp,
  },
  {
    title: 'Distributions',
    value: '$18,200',
    change: '+15.3%',
    changeType: 'positive' as const,
    icon: Target,
  },
];

const recentInvestments = [
  {
    id: 1,
    name: 'Meridian Office Complex',
    type: 'Commercial Real Estate',
    amount: '$75,000',
    status: 'active',
    returns: '12.5%',
    date: '2024-01-15',
  },
  {
    id: 2,
    name: 'Tech Growth Fund III',
    type: 'Private Equity',
    amount: '$100,000',
    status: 'active',
    returns: '18.2%',
    date: '2023-11-20',
  },
  {
    id: 3,
    name: 'Green Energy Portfolio',
    type: 'Infrastructure',
    amount: '$50,000',
    status: 'pending',
    returns: 'TBD',
    date: '2024-02-01',
  },
];

const upcomingOpportunities = [
  {
    id: 1,
    name: 'Luxury Residential Development',
    type: 'Real Estate',
    minInvestment: '$25,000',
    targetReturn: '15-18%',
    term: '3-5 years',
    closingDate: '2024-03-15',
  },
  {
    id: 2,
    name: 'Healthcare Innovation Fund',
    type: 'Venture Capital',
    minInvestment: '$50,000',
    targetReturn: '20-25%',
    term: '5-7 years',
    closingDate: '2024-03-30',
  },
];

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.firstName}
        </h1>
        <p className="text-muted-foreground">
          Here's an overview of your investment portfolio and available opportunities.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={stat.changeType === 'positive' ? 'text-success' : 'text-destructive'}>
                    {stat.change}
                  </span>
                  {' '}from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Investments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Investments</CardTitle>
                <CardDescription>
                  Your latest investment activities
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentInvestments.map((investment) => (
                <div key={investment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{investment.name}</p>
                      <p className="text-sm text-muted-foreground">{investment.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{investment.amount}</p>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={investment.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {investment.status}
                      </Badge>
                      <span className="text-sm text-success">{investment.returns}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Opportunities */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>New Opportunities</CardTitle>
                <CardDescription>
                  Investment opportunities closing soon
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                Browse All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingOpportunities.map((opportunity) => (
                <div key={opportunity.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{opportunity.name}</h4>
                      <p className="text-sm text-muted-foreground">{opportunity.type}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="mr-1 h-3 w-3" />
                      Closes {new Date(opportunity.closingDate).toLocaleDateString()}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Min Investment</p>
                      <p className="font-medium">{opportunity.minInvestment}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Target Return</p>
                      <p className="font-medium text-success">{opportunity.targetReturn}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Term</p>
                      <p className="font-medium">{opportunity.term}</p>
                    </div>
                  </div>
                  
                  <Button size="sm" className="w-full">
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Account Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Profile Completion</span>
                <span className="text-sm text-muted-foreground">85%</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">KYC Verification</span>
                <Badge variant="default" className="text-xs">Verified</Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Accredited Status</span>
                <Badge variant={user?.isAccredited ? 'default' : 'secondary'} className="text-xs">
                  {user?.isAccredited ? 'Verified' : 'Pending'}
                </Badge>
              </div>
            </div>
          </div>
          
          {!user?.isAccredited && (
            <div className="mt-4 p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning" />
                <p className="text-sm text-warning font-medium">
                  Complete your accredited investor verification to access premium opportunities.
                </p>
              </div>
              <Button variant="outline" size="sm" className="mt-2">
                Complete Verification
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};