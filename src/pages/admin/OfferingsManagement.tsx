import React, { useState } from 'react';
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

const OfferingsManagement: React.FC = () => {
  const { isAdmin } = usePermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');

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

  // Mock data - will be replaced with real data from Supabase
  const offerings = [
    {
      id: '1',
      title: 'Downtown Office Complex',
      type: 'Real Estate',
      status: 'active',
      targetAmount: 5000000,
      raisedAmount: 2500000,
      minimumInvestment: 25000,
      closingDate: '2024-12-31',
      investors: 24,
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      title: 'Tech Startup Series A',
      type: 'Equity',
      status: 'draft',
      targetAmount: 2000000,
      raisedAmount: 0,
      minimumInvestment: 10000,
      closingDate: '2024-11-30',
      investors: 0,
      createdAt: '2024-02-01'
    },
    {
      id: '3',
      title: 'Green Energy Fund',
      type: 'Fund',
      status: 'closed',
      targetAmount: 10000000,
      raisedAmount: 10000000,
      minimumInvestment: 50000,
      closingDate: '2024-06-30',
      investors: 87,
      createdAt: '2023-12-01'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getProgressPercentage = (raised: number, target: number) => {
    return Math.min((raised / target) * 100, 100);
  };

  const filteredOfferings = offerings.filter(offering => {
    const matchesSearch = offering.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         offering.type.toLowerCase().includes(searchQuery.toLowerCase());
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
          <div className="grid grid-cols-1 gap-6">
            {filteredOfferings.map((offering) => (
              <Card key={offering.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{offering.title}</CardTitle>
                        <Badge className={getStatusColor(offering.status)}>
                          {offering.status}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-4">
                        <span>{offering.type}</span>
                        <span>•</span>
                        <span>Created {new Date(offering.createdAt).toLocaleDateString()}</span>
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
                          <Link to={`/admin/offerings/${offering.id}`}>
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
                          {getProgressPercentage(offering.raisedAmount, offering.targetAmount).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mb-2">
                        <div 
                          className="bg-primary rounded-full h-2 transition-all duration-300"
                          style={{ width: `${getProgressPercentage(offering.raisedAmount, offering.targetAmount)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{formatCurrency(offering.raisedAmount)}</span>
                        <span className="text-muted-foreground">of {formatCurrency(offering.targetAmount)}</span>
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Min Investment</p>
                          <p className="text-sm font-medium">{formatCurrency(offering.minimumInvestment)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Investors</p>
                          <p className="text-sm font-medium">{offering.investors}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Closing Date</p>
                          <p className="text-sm font-medium">
                            {new Date(offering.closingDate).toLocaleDateString()}
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
                      <Link to={`/admin/offerings/${offering.id}`}>
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