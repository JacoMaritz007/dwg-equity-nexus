import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
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
import { transformOfferingForDisplay, getStatusColor, formatCurrency } from '@/utils/offeringHelpers';
import { useVerificationStatus } from '@/hooks/useVerificationStatus';
import { Navigation } from '@/components/layout/Navigation';
import { PledgeWizard } from '@/components/pledge/PledgeWizard';
import { PledgeProgressBar } from '@/components/pledge/PledgeProgressBar';
import { toast } from 'sonner';
import { useDocuments } from '@/hooks/useDocuments';

export const OfferingDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { fetchOfferingById } = useInvestmentOfferings();
  const { status: verificationStatus } = useVerificationStatus();
  const { getSignedUrl, downloadDocument } = useDocuments();
  const [offering, setOffering] = useState<InvestmentOfferingWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [featuredImageError, setFeaturedImageError] = useState(false);
  const [galleryImageErrors, setGalleryImageErrors] = useState<Record<string, boolean>>({});

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

  // Check if user wants to start investment process
  useEffect(() => {
    if (searchParams.get('action') === 'pledge' && offering) {
      setShowInvestmentModal(true);
    }
  }, [searchParams, offering]);

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
            <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden">
              {offering.offering_media?.find(media => media.media_type === 'featured_image')?.url && !featuredImageError ? (
                <img
                  src={offering.offering_media.find(media => media.media_type === 'featured_image')?.url}
                  alt={offering.title}
                  className="w-full h-full object-cover"
                  onError={() => setFeaturedImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <Building className="h-20 w-20 text-muted-foreground" />
                </div>
              )}
            </div>
            
            {/* Gallery Images */}
            {offering.offering_media && offering.offering_media.filter(media => media.media_type === 'gallery_image').length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Gallery</h4>
                <div className="grid grid-cols-3 gap-2">
                  {offering.offering_media
                    .filter(media => media.media_type === 'gallery_image')
                    .slice(0, 6)
                    .map((media, index) => (
                      <div key={media.id} className="aspect-video bg-muted rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                        {!galleryImageErrors[media.id] ? (
                          <img
                            src={media.url}
                            alt={`${offering.title} gallery ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={() => setGalleryImageErrors(prev => ({ ...prev, [media.id]: true }))}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                              <circle cx="9" cy="9" r="2"/>
                              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                            </svg>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
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
                <CardContent className="pt-4 space-y-2">
                  <span className="text-sm font-medium">Funding Progress</span>
                  <PledgeProgressBar
                    raisedAmount={displayData.raisedAmount}
                    raisedPercentage={displayData.raisedPercentage}
                    pledgedAmount={displayData.pledgedAmount}
                    pledgedPercentage={displayData.pledgedPercentage}
                    pledgerCount={displayData.pledgerCount}
                    size="lg"
                  />
                </CardContent>
              </Card>
            )}

            {/* Investment Actions */}
            {offering.status === 'active' && (
              <div className="space-y-2">
                <Button 
                  size="lg" 
                  className="w-full financial-button"
                  onClick={() => {
                    if (!verificationStatus?.can_invest) {
                      toast.error('Please complete verification before pledging');
                      window.location.href = '/account-status';
                      return;
                    }
                    setShowInvestmentModal(true);
                  }}
                >
                  {verificationStatus?.can_invest ? 'Commit Capital' : 'Complete Verification to Pledge'}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  You're not transferring funds today — you're making a binding commitment to invest
                  when capital is called
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                const url = await getSignedUrl(doc.file_path, 'offering-documents');
                                if (url) {
                                  window.open(url, '_blank');
                                } else {
                                  toast.error('Failed to open document');
                                }
                              }}
                            >
                              View
                            </Button>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => downloadDocument(doc.file_path, doc.title || 'document')}
                           >
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
                          {formatCurrency(offering.maximum_investment)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Pledge Wizard */}
        {offering && (
          <PledgeWizard
            offering={offering}
            isOpen={showInvestmentModal}
            onClose={() => setShowInvestmentModal(false)}
          />
        )}
      </div>
    </div>
  );
};