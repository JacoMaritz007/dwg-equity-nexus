import React, { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Eye, 
  Trash2,
  DollarSign,
  Calendar,
  Users,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useInvestmentOfferings } from '@/hooks/useInvestmentOfferings';
import { getStatusColor, formatCurrency, getProgressPercentage } from '@/utils/offeringHelpers';

const OfferingsManagement: React.FC = () => {
  const { isAdmin } = usePermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  
  const { offerings, loading, error, fetchOfferings } = useInvestmentOfferings();

  if (!isAdmin()) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground mt-2">You don't have admin permissions.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchOfferings({
      search: searchQuery,
      status: selectedTab,
    });
  }, [searchQuery, selectedTab, fetchOfferings]);

  const filteredOfferings = offerings.filter(offering => {
    const matchesSearch = offering.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         offering.investment_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = selectedTab === 'all' || offering.status === selectedTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Investment Offerings</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track all investment opportunities
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/offerings/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Offering
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search offerings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All ({offerings.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({offerings.filter(o => o.status === 'active').length})</TabsTrigger>
          <TabsTrigger value="draft">Draft ({offerings.filter(o => o.status === 'draft').length})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({offerings.filter(o => o.status === 'closed').length})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-1/3" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="md:col-span-2 space-y-2">
                        <div className="h-4 bg-muted rounded" />
                        <div className="h-2 bg-muted rounded" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded" />
                        <div className="h-4 bg-muted rounded" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded" />
                        <div className="h-4 bg-muted rounded" />
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
            <div className="grid grid-cols-1 gap-6">
              {filteredOfferings.map((offering) => (
              <Card key={offering.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{offering.title}</CardTitle>
                        <Badge className={getStatusColor(offering.status || '')}>
                          {offering.status}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-4">
                        <span>{offering.investment_type}</span>
                        <span>•</span>
                        <span>Created {new Date(offering.created_at).toLocaleDateString()}</span>
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/invest/offerings/${offering.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/admin/offerings/${offering.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Funding Progress */}
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Funding Progress</span>
                        <span className="text-sm text-muted-foreground">
                          {getProgressPercentage(offering.raised_amount || 0, offering.target_amount).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mb-2">
                        <div 
                          className="bg-primary rounded-full h-2 transition-all duration-300"
                          style={{ width: `${getProgressPercentage(offering.raised_amount || 0, offering.target_amount)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{formatCurrency(offering.raised_amount || 0)}</span>
                        <span className="text-muted-foreground">of {formatCurrency(offering.target_amount)}</span>
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Min Investment</p>
                          <p className="text-sm font-medium">{formatCurrency(offering.minimum_investment)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Investors</p>
                          <p className="text-sm font-medium">{offering.investor_count || 0}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Closing Date</p>
                          <p className="text-sm font-medium">
                            {offering.closing_date ? new Date(offering.closing_date).toLocaleDateString() : 'TBD'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Status</p>
                          <p className="text-sm font-medium capitalize">{offering.status}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-6 pt-4 border-t">
                    <Button asChild size="sm">
                      <Link to={`/invest/offerings/${offering.id}`}>
                        View Details
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/admin/offerings/${offering.id}/edit`}>
                        Edit
                      </Link>
                    </Button>
                    {offering.status === 'active' && (
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/admin/capital-calls/create?offering=${offering.id}`}>
                          Create Capital Call
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          )}

          {filteredOfferings.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No offerings found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'Try adjusting your search terms.' : 'Get started by creating your first investment offering.'}
                </p>
                {!searchQuery && (
                  <Button asChild>
                    <Link to="/admin/offerings/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Offering
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OfferingsManagement;