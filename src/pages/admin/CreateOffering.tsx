import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft, 
  Save, 
  DollarSign, 
  Calendar, 
  FileText,
  MapPin,
  TrendingUp
} from 'lucide-react';

interface OfferingFormData {
  title: string;
  description: string;
  investment_type: string;
  target_amount: string;
  minimum_investment: string;
  maximum_investment: string;
  expected_return: string;
  investment_term: string;
  location: string;
  closing_date: string;
  status: 'draft' | 'active';
}

const CreateOffering: React.FC = () => {
  const { isAdmin } = usePermissions();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<OfferingFormData>({
    title: '',
    description: '',
    investment_type: '',
    target_amount: '',
    minimum_investment: '',
    maximum_investment: '',
    expected_return: '',
    investment_term: '',
    location: '',
    closing_date: '',
    status: 'draft'
  });

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

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent, saveAsDraft: boolean = false) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.investment_type || !formData.target_amount || !formData.minimum_investment) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields.",
          variant: "destructive"
        });
        return;
      }

      const offeringData = {
        title: formData.title,
        description: formData.description || null,
        investment_type: formData.investment_type,
        target_amount: parseFloat(formData.target_amount),
        minimum_investment: parseFloat(formData.minimum_investment),
        maximum_investment: formData.maximum_investment ? parseFloat(formData.maximum_investment) : null,
        expected_return: formData.expected_return || null,
        investment_term: formData.investment_term || null,
        location: formData.location || null,
        closing_date: formData.closing_date ? new Date(formData.closing_date).toISOString() : null,
        status: saveAsDraft ? 'draft' : formData.status,
        created_by: user?.id,
        raised_amount: 0
      };

      const { data, error } = await supabase
        .from('investment_offerings')
        .insert([offeringData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: `Investment offering ${saveAsDraft ? 'saved as draft' : 'created'} successfully.`
      });

      navigate('/admin/offerings');
    } catch (error) {
      console.error('Error creating offering:', error);
      toast({
        title: "Error",
        description: "Failed to create investment offering. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/offerings')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Offerings
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Investment Offering</h1>
          <p className="text-muted-foreground mt-2">
            Set up a new investment opportunity for your platform
          </p>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Essential details about the investment opportunity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Downtown Office Complex"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="investment_type">Investment Type *</Label>
                <Select value={formData.investment_type} onValueChange={(value) => handleInputChange('investment_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select investment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Real Estate">Real Estate</SelectItem>
                    <SelectItem value="Equity">Equity</SelectItem>
                    <SelectItem value="Debt">Debt</SelectItem>
                    <SelectItem value="Fund">Fund</SelectItem>
                    <SelectItem value="Alternative">Alternative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the investment opportunity, key highlights, and strategy..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="location">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Location
                </Label>
                <Input
                  id="location"
                  placeholder="e.g., New York, NY"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="investment_term">Investment Term</Label>
                <Input
                  id="investment_term"
                  placeholder="e.g., 5 years, 10 years"
                  value={formData.investment_term}
                  onChange={(e) => handleInputChange('investment_term', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Details
            </CardTitle>
            <CardDescription>
              Investment amounts and expected returns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="target_amount">Target Amount *</Label>
                <Input
                  id="target_amount"
                  type="number"
                  placeholder="e.g., 5000000"
                  value={formData.target_amount}
                  onChange={(e) => handleInputChange('target_amount', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimum_investment">Minimum Investment *</Label>
                <Input
                  id="minimum_investment"
                  type="number"
                  placeholder="e.g., 25000"
                  value={formData.minimum_investment}
                  onChange={(e) => handleInputChange('minimum_investment', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maximum_investment">Maximum Investment</Label>
                <Input
                  id="maximum_investment"
                  type="number"
                  placeholder="e.g., 500000"
                  value={formData.maximum_investment}
                  onChange={(e) => handleInputChange('maximum_investment', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_return">
                <TrendingUp className="h-4 w-4 inline mr-1" />
                Expected Return
              </Label>
              <Input
                id="expected_return"
                placeholder="e.g., 8-12% annually, 15% IRR"
                value={formData.expected_return}
                onChange={(e) => handleInputChange('expected_return', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Timeline & Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timeline & Status
            </CardTitle>
            <CardDescription>
              Investment timeline and publication status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="closing_date">Closing Date</Label>
                <Input
                  id="closing_date"
                  type="date"
                  value={formData.closing_date}
                  onChange={(e) => handleInputChange('closing_date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Publication Status</Label>
                <Select value={formData.status} onValueChange={(value: 'draft' | 'active') => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/offerings')}
          >
            Cancel
          </Button>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => handleSubmit(e, true)}
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              Save as Draft
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Offering'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateOffering;