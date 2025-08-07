import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Building, 
  Calendar, 
  DollarSign, 
  Target, 
  Users, 
  FileText, 
  Download,
  TrendingUp,
  MapPin,
  Clock
} from 'lucide-react';
import { useInvestmentOfferings } from '@/hooks/useInvestmentOfferings';
import { InvestmentOfferingWithDetails } from '@/types/investment';
import { transformOfferingForDisplay, getStatusColor } from '@/utils/offeringHelpers';
import { Navigation } from '@/components/layout/Navigation';

export const OfferingDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchOfferingById } = useInvestmentOfferings();
  const [offering, setOffering] = useState<InvestmentOfferingWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOffering = async () => {
      if (!id) {
        navigate('/invest');
        return;
      }

      setLoading(true);
      const data = await fetchOfferingById(id);
      setOffering(data);
      setLoading(false);

      if (!data) {
        navigate('/invest');
      }
    };

    loadOffering();
  }, [id, fetchOfferingById, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading offering details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!offering) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Offering Not Found</h1>
            <p className="text-muted-foreground mb-4">The requested investment offering could not be found.</p>
            <Button asChild>
              <Link to="/invest">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Offerings
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const displayData = transformOfferingForDisplay(offering);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6 space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link to="/invest" className="text-muted-foreground hover:text-foreground">
            Investment Opportunities
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">{offering.title}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Image */}
          <div className="lg:w-1/2">
            <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center overflow-hidden">
              {displayData.image.includes('placeholder') ? (
                <Building className="h-20 w-20 text-muted-foreground" />
              ) : (
                <img 
                  src={displayData.image} 
                  alt={offering.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/api/placeholder/400/250';
                  }}
                />
              )}
            </div>
            
            {/* Additional Media Gallery */}
            {offering.offering_media && offering.offering_media.length > 1 && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {offering.offering_media
                  .filter(media => media.url && media.url !== displayData.image)
                  .slice(0, 3)
                  .map((media, index) => (
                    <div key={media.id} className="aspect-video bg-muted rounded overflow-hidden">
                      <img 
                        src={media.url?.startsWith('http') ? media.url : `/api/placeholder/120/80`}
                        alt={`${offering.title} ${index + 2}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/api/placeholder/120/80';
                        }}
                      />
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Key Information */}
          <div className="lg:w-1/2 space-y-6">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold">{offering.title}</h1>
                <Badge className={getStatusColor(offering.status || '')}>
                  {offering.status}
                </Badge>
              </div>
              <p className="text-muted-foreground text-lg">{offering.description}</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Target Amount</span>
                  </div>
                  <p className="text-2xl font-bold">{displayData.offeringSize}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Min Investment</span>
                  </div>
                  <p className="text-2xl font-bold">{displayData.minInvestment}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Expected Return</span>
                  </div>
                  <p className="text-2xl font-bold text-success">{displayData.targetReturn}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Investment Term</span>
                  </div>
                  <p className="text-2xl font-bold">{displayData.term}</p>
                </CardContent>
              </Card>
            </div>

            {/* Progress */}
            {offering.status === 'active' && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Funding Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {displayData.raisedPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 mb-2">
                    <div 
                      className="bg-primary rounded-full h-3 transition-all duration-300"
                      style={{ width: `${displayData.raisedPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">${displayData.raisedAmount.toLocaleString()}</span>
                    <span className="text-muted-foreground">raised</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Investment Actions */}
            {offering.status === 'active' && (
              <div className="space-y-2">
                <Button size="lg" className="w-full financial-button">
                  Invest Now
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  By investing, you agree to our terms and conditions
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Information */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Investment Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-muted-foreground">{offering.description}</p>
                </div>

                {offering.location && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Location
                    </h4>
                    <p className="text-muted-foreground">{offering.location}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-2">Key Highlights</h4>
                  <ul className="space-y-1">
                    {displayData.highlights.map((highlight, index) => (
                      <li key={index} className="flex items-start gap-2 text-muted-foreground">
                        <span className="text-primary mt-1">•</span>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Offering Documents</CardTitle>
                <CardDescription>
                  Review all relevant documents for this investment opportunity
                </CardDescription>
              </CardHeader>
              <CardContent>
                 {offering.offering_documents && offering.offering_documents.length > 0 ? (
                   <div className="space-y-3">
                     {offering.offering_documents.map((doc) => (
                       <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                         <div className="flex items-center gap-3">
                           <FileText className="h-5 w-5 text-muted-foreground" />
                           <div>
                             <p className="font-medium">{doc.title}</p>
                             <p className="text-sm text-muted-foreground">{doc.description}</p>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {doc.document_category?.replace('_', ' ').toUpperCase()}
                                </Badge>
                                {doc.file_size && (
                                  <span className="text-xs text-muted-foreground">
                                    {(doc.file_size / 1024 / 1024).toFixed(1)} MB
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => window.open(doc.file_path, '_blank')}>
                              View
                            </Button>
                           <Button variant="outline" size="sm">
                             <Download className="h-4 w-4 mr-2" />
                             Download
                           </Button>
                         </div>
                       </div>
                     ))}
                   </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No documents available yet
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Investment Timeline</CardTitle>
                <CardDescription>
                  Key milestones and important dates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {offering.offering_milestones && offering.offering_milestones.length > 0 ? (
                   <div className="space-y-4">
                     {offering.offering_milestones
                       .sort((a, b) => new Date(a.milestone_date).getTime() - new Date(b.milestone_date).getTime())
                       .map((milestone, index, array) => (
                         <div key={milestone.id} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className="w-3 h-3 rounded-full bg-primary"></div>
                              {index < array.length - 1 && (
                                <div className="w-px h-8 bg-border mt-2"></div>
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                  {new Date(milestone.milestone_date).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-muted-foreground">{milestone.description}</p>
                            </div>
                         </div>
                       ))}
                   </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No timeline information available yet
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financials" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Details</CardTitle>
                <CardDescription>
                  Detailed financial information and projections
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Target Returns */}
                <div>
                  <h4 className="font-semibold mb-3">Target Returns</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {offering.targeted_irr && (
                      <div className="text-center p-3 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Target IRR</p>
                        <p className="text-lg font-bold">{offering.targeted_irr}%</p>
                      </div>
                    )}
                    {offering.targeted_avg_coc && (
                      <div className="text-center p-3 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Avg CoC</p>
                        <p className="text-lg font-bold">{offering.targeted_avg_coc}%</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Fee Structure */}
                <div>
                  <h4 className="font-semibold mb-3">Fee Structure</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {offering.base_fee && (
                      <div className="text-center p-3 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Base Fee</p>
                        <p className="text-lg font-bold">{offering.base_fee}%</p>
                      </div>
                    )}
                    {offering.success_fee && (
                      <div className="text-center p-3 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Success Fee</p>
                        <p className="text-lg font-bold">{offering.success_fee}%</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Investment Limits */}
                <div>
                  <h4 className="font-semibold mb-3">Investment Limits</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Minimum Investment</p>
                      <p className="text-lg font-bold">{displayData.minInvestment}</p>
                    </div>
                    {offering.maximum_investment && (
                      <div className="p-3 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Maximum Investment</p>
                        <p className="text-lg font-bold">
                          ${offering.maximum_investment.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};