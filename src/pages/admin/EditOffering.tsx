import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreateOfferingForm } from '@/components/offerings/CreateOfferingForm';
import { usePermissions } from '@/hooks/usePermissions';
import { useInvestmentOfferings } from '@/hooks/useInvestmentOfferings';
import { InvestmentOfferingWithDetails } from '@/types/investment';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const EditOffering: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canAccessAdmin } = usePermissions();
  const { fetchOfferingById } = useInvestmentOfferings();
  const [offering, setOffering] = useState<InvestmentOfferingWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('No offering ID provided');
      setLoading(false);
      return;
    }

    const loadOffering = async () => {
      try {
        const data = await fetchOfferingById(id);
        if (!data) {
          setError('Offering not found');
        } else {
          setOffering(data);
        }
      } catch (err) {
        setError('Failed to load offering');
      } finally {
        setLoading(false);
      }
    };

    loadOffering();
  }, [id, fetchOfferingById]);

  if (!canAccessAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/offerings')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Offerings
            </Button>
          </div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-96 mb-4" />
          <Skeleton className="h-2 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error || !offering) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/offerings')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Offerings
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p className="text-muted-foreground">{error || 'Offering not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return <CreateOfferingForm offering={offering} isEditMode={true} />;
};

export default EditOffering;