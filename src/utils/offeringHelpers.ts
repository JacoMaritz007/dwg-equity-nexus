import { InvestmentOfferingWithDetails, OfferingDisplayData } from '@/types/investment';

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

  // Get primary image from media
  const primaryImage = offering.offering_media?.find(media => 
    media.media_type === 'image' && media.display_order === 0
  )?.url || offering.image_url || '/api/placeholder/400/250';

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