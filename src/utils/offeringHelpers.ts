import { InvestmentOfferingWithDetails, OfferingDisplayData } from '@/types/investment';
import { supabase } from '@/integrations/supabase/client';

// Utility function to get Supabase storage public URL
export const getStorageUrl = (filePath: string): string => {
  if (!filePath) return '/api/placeholder/400/250';
  
  // If it's already a full URL, return as is
  if (filePath.startsWith('http')) return filePath;
  
  // Generate Supabase storage public URL
  const { data } = supabase.storage.from('offering-media').getPublicUrl(filePath);
  return data.publicUrl || '/api/placeholder/400/250';
};

export const transformOfferingForDisplay = (offering: InvestmentOfferingWithDetails): OfferingDisplayData => {
  // Calculate raised percentage
  const raisedPercentage = offering.target_amount 
    ? Math.min(((offering.raised_amount || 0) / offering.target_amount) * 100, 100)
    : 0;

  // Format currency values
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get primary image from media - check for featured_image type first
  let primaryImage = '/api/placeholder/400/250';
  
  if (offering.offering_media && offering.offering_media.length > 0) {
    // Look for featured_image first
    const featuredImage = offering.offering_media.find(media => 
      media.media_type === 'featured_image'
    );
    
    if (featuredImage && featuredImage.url) {
      primaryImage = getStorageUrl(featuredImage.url);
    } else {
      // Fallback to first image ordered by display_order
      const firstImage = offering.offering_media
        .filter(media => media.media_type === 'image' || media.media_type === 'featured_image')
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))[0];
      
      if (firstImage && firstImage.url) {
        primaryImage = getStorageUrl(firstImage.url);
      }
    }
  }
  
  // Fallback to image_url field if available
  if (primaryImage === '/api/placeholder/400/250' && offering.image_url) {
    primaryImage = getStorageUrl(offering.image_url);
  }

  // Generate highlights from offering data
  const highlights: string[] = [];
  if (offering.location) highlights.push(`Located in ${offering.location}`);
  if (offering.expected_return) highlights.push(`Target return: ${offering.expected_return}`);
  if (offering.investor_count && offering.investor_count > 0) {
    highlights.push(`${offering.investor_count} investors`);
  }

  // Determine status for display
  let displayStatus: 'active' | 'past' | 'coming-soon' = 'active';
  if (offering.status === 'draft') {
    displayStatus = 'coming-soon';
  } else if (['closed', 'cancelled'].includes(offering.status || '')) {
    displayStatus = 'past';
  }

  return {
    id: offering.id,
    title: offering.title,
    subtitle: offering.description?.substring(0, 100) + '...' || '',
    type: offering.investment_type,
    image: primaryImage,
    offeringSize: formatCurrency(offering.target_amount),
    minInvestment: formatCurrency(offering.minimum_investment),
    targetReturn: offering.expected_return || 'TBD',
    term: offering.investment_term || 'TBD',
    status: displayStatus,
    raisedAmount: offering.raised_amount || 0,
    raisedPercentage,
    closingDate: offering.closing_date || '',
    highlights,
    description: offering.description || '',
    location: offering.location || '',
    documents: offering.offering_documents || [],
    milestones: offering.offering_milestones || [],
    media: offering.offering_media || [],
  };
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getProgressPercentage = (raised: number, target: number) => {
  return Math.min((raised / target) * 100, 100);
};