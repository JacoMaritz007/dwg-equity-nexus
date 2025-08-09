import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { useInvestmentOfferings } from '@/hooks/useInvestmentOfferings';
import { useVerificationStatus } from '@/hooks/useVerificationStatus';
import { transformOfferingForDisplay } from '@/utils/offeringHelpers';
import { OfferingDisplayData } from '@/types/investment';
import { toast } from 'sonner';


export const InvestPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('closing_date');
  const [activeTab, setActiveTab] = useState('active');
  
  const { offerings, loading, error, fetchOfferings, getActiveOfferings, getPastOfferings } = useInvestmentOfferings();
  const { status: verificationStatus } = useVerificationStatus();
  const [displayOfferings, setDisplayOfferings] = useState<OfferingDisplayData[]>([]);

  // Transform offerings for display
  useEffect(() => {
    const transformed = offerings.map(transformOfferingForDisplay);
    setDisplayOfferings(transformed);
  }, [offerings]);

  // Filter and sort offerings
  const filteredOfferings = displayOfferings.filter(offering => {
    const matchesSearch = offering.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         offering.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || offering.type.toLowerCase().includes(filterType.toLowerCase());
    const matchesTab = activeTab === 'active' ? offering.status === 'active' : offering.status === 'past';
    return matchesSearch && matchesType && matchesTab;
  });

  // Apply sorting
  const sortedOfferings = [...filteredOfferings].sort((a, b) => {
    switch (sortBy) {
      case 'closing_date':
        return new Date(b.closingDate).getTime() - new Date(a.closingDate).getTime();
      case 'target_amount':
        return parseFloat(b.offeringSize.replace(/[$,]/g, '')) - parseFloat(a.offeringSize.replace(/[$,]/g, ''));
      case 'minimum_investment':
        return parseFloat(b.minInvestment.replace(/[$,]/g, '')) - parseFloat(a.minInvestment.replace(/[$,]/g, ''));
      default:
        return 0;
    }
  });

  // Refetch when filters change
  useEffect(() => {
    fetchOfferings({
      search: searchQuery,
      type: filterType,
      status: activeTab,
      sortBy: sortBy as any,
    });
  }, [searchQuery, filterType, activeTab, sortBy, fetchOfferings]);

  const OfferingCard: React.FC<{ offering: OfferingDisplayData }> = ({ offering }) => (
    <Card className="investment-card hover:shadow-lg transition-all duration-300">
      <div className="aspect-video w-full bg-muted rounded-t-lg overflow-hidden">
        {offering.image && !offering.image.includes('placeholder') ? (
          <img 
            src={offering.image} 
            alt={offering.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement!.classList.add('flex', 'items-center', 'justify-center');
              target.parentElement!.innerHTML = '<div class="h-12 w-12 text-muted-foreground"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg></div>';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Building className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
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
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link to={`/invest/offerings/${offering.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </Button>
          {offering.status === 'active' && (
            <Button 
              size="sm" 
              className="flex-1 financial-button"
              onClick={() => {
                if (!verificationStatus?.can_invest) {
                  toast.error('Please complete verification before investing');
                  window.location.href = '/account-status';
                  return;
                }
                window.location.href = `/invest/offerings/${offering.id}?action=invest`;
              }}
            >
              {verificationStatus?.can_invest ? (
                <>
                  Invest Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Verify to Invest
                </>
              )}
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
          <TabsTrigger 
            value="active" 
            className="flex items-center gap-2"
            onClick={() => setActiveTab('active')}
          >
            <TrendingUp className="h-4 w-4" />
            Active Offerings
          </TabsTrigger>
          <TabsTrigger 
            value="past" 
            className="flex items-center gap-2"
            onClick={() => setActiveTab('past')}
          >
            <Clock className="h-4 w-4" />
            Past Offerings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-video w-full bg-muted rounded-t-lg" />
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-8 bg-muted rounded" />
                        <div className="h-8 bg-muted rounded" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive">{error}</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sortedOfferings.map((offering) => (
                <OfferingCard key={offering.id} offering={offering} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-video w-full bg-muted rounded-t-lg" />
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sortedOfferings.map((offering) => (
                <OfferingCard key={offering.id} offering={offering} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};