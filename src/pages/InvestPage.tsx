import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Target, 
  Clock,
  Search,
  Filter,
  Eye,
  ArrowRight
} from 'lucide-react';

interface InvestmentOffering {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  image: string;
  offeringSize: string;
  minInvestment: string;
  targetReturn: string;
  term: string;
  status: 'active' | 'past' | 'coming-soon';
  raisedAmount: number;
  raisedPercentage: number;
  closingDate: string;
  highlights: string[];
}

const activeOfferings: InvestmentOffering[] = [
  {
    id: '1',
    title: 'Meridian Office Complex',
    subtitle: 'Premium Commercial Real Estate',
    type: 'Real Estate',
    image: '/api/placeholder/400/250',
    offeringSize: '$5,000,000',
    minInvestment: '$25,000',
    targetReturn: '12-15% IRR',
    term: '3-5 years',
    status: 'active',
    raisedAmount: 3200000,
    raisedPercentage: 64,
    closingDate: '2024-03-15',
    highlights: [
      'Prime downtown location',
      'Fully leased to Fortune 500 tenants',
      'Recent $2M renovation completed'
    ]
  },
  {
    id: '2',
    title: 'Green Energy Infrastructure Fund',
    subtitle: 'Renewable Energy Portfolio',
    type: 'Infrastructure',
    image: '/api/placeholder/400/250',
    offeringSize: '$15,000,000',
    minInvestment: '$50,000',
    targetReturn: '15-20% IRR',
    term: '5-7 years',
    status: 'active',
    raisedAmount: 8500000,
    raisedPercentage: 57,
    closingDate: '2024-04-01',
    highlights: [
      'Diversified solar and wind projects',
      '20-year power purchase agreements',
      'Government tax incentives included'
    ]
  },
  {
    id: '3',
    title: 'Healthcare Innovation Fund III',
    subtitle: 'Medical Technology Ventures',
    type: 'Venture Capital',
    image: '/api/placeholder/400/250',
    offeringSize: '$25,000,000',
    minInvestment: '$100,000',
    targetReturn: '20-30% IRR',
    term: '5-8 years',
    status: 'active',
    raisedAmount: 12000000,
    raisedPercentage: 48,
    closingDate: '2024-03-30',
    highlights: [
      'Focus on AI-driven medical devices',
      'Experienced healthcare investment team',
      'Strategic partnerships with major hospitals'
    ]
  }
];

const pastOfferings: InvestmentOffering[] = [
  {
    id: '4',
    title: 'Luxury Residential Development',
    subtitle: 'High-End Apartment Complex',
    type: 'Real Estate',
    image: '/api/placeholder/400/250',
    offeringSize: '$8,000,000',
    minInvestment: '$25,000',
    targetReturn: '18.5% IRR',
    term: '4 years',
    status: 'past',
    raisedAmount: 8000000,
    raisedPercentage: 100,
    closingDate: '2023-06-15',
    highlights: [
      'Successfully completed and sold',
      'Exceeded target returns by 2.5%',
      'All distributions completed'
    ]
  }
];

export const InvestPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('closing-date');

  const OfferingCard: React.FC<{ offering: InvestmentOffering }> = ({ offering }) => (
    <Card className="investment-card hover:shadow-lg transition-all duration-300">
      <div className="aspect-video w-full bg-muted rounded-t-lg flex items-center justify-center">
        <Building className="h-12 w-12 text-muted-foreground" />
      </div>
      
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{offering.title}</CardTitle>
            <CardDescription>{offering.subtitle}</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {offering.type}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Offering Size</p>
            <p className="font-semibold">{offering.offeringSize}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Min Investment</p>
            <p className="font-semibold">{offering.minInvestment}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Target Return</p>
            <p className="font-semibold text-success">{offering.targetReturn}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Term</p>
            <p className="font-semibold">{offering.term}</p>
          </div>
        </div>

        {/* Progress Bar (for active offerings) */}
        {offering.status === 'active' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Raised: ${offering.raisedAmount.toLocaleString()}</span>
              <span className="font-medium">{offering.raisedPercentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary rounded-full h-2 transition-all duration-300"
                style={{ width: `${offering.raisedPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Closing Date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {offering.status === 'active' 
              ? `Closes ${new Date(offering.closingDate).toLocaleDateString()}`
              : `Closed ${new Date(offering.closingDate).toLocaleDateString()}`
            }
          </span>
        </div>

        {/* Highlights */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Key Highlights:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            {offering.highlights.slice(0, 2).map((highlight, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                {highlight}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Button>
          {offering.status === 'active' && (
            <Button size="sm" className="flex-1 financial-button">
              Invest Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Investment Opportunities</h1>
        <p className="text-muted-foreground">
          Discover and invest in carefully curated opportunities across real estate, private equity, and alternative investments.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search opportunities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-4">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="real-estate">Real Estate</SelectItem>
                  <SelectItem value="private-equity">Private Equity</SelectItem>
                  <SelectItem value="venture-capital">Venture Capital</SelectItem>
                  <SelectItem value="infrastructure">Infrastructure</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="closing-date">Closing Date</SelectItem>
                  <SelectItem value="target-return">Target Return</SelectItem>
                  <SelectItem value="min-investment">Min Investment</SelectItem>
                  <SelectItem value="offering-size">Offering Size</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Offerings Tabs */}
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-400">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Active Offerings
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Past Offerings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeOfferings.map((offering) => (
              <OfferingCard key={offering.id} offering={offering} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="past">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pastOfferings.map((offering) => (
              <OfferingCard key={offering.id} offering={offering} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};