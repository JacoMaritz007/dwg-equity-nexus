import { InvestmentOfferingWithDetails, OfferingDisplayData } from '@/types/investment';

// The 'offering-media' bucket is private now (org policy blocks public
// buckets — see backend/README.md), so there's no synchronous public-URL
// construction possible anymore. The backend pre-signs media URLs
// server-side before returning offering data (see
// backend/src/routes/offerings.ts's withSignedMediaUrls) — by the time a
// media object reaches this function, `filePath`/`url` IS already the
// usable (signed, time-limited) URL. This helper just handles the
// already-a-URL / missing-value cases.
export const getStorageUrl = (filePath: string): string => {
  if (!filePath) return '/api/placeholder/400/250';
  if (filePath.startsWith('http')) return filePath;
  // No filePath-to-URL construction is possible client-side anymore; if we
  // get here, the caller passed a bare storage path instead of the
  // pre-signed URL the API already provides — that's a bug upstream, not
  // something to paper over here.
  console.warn('getStorageUrl received an un-signed path; the API should have signed it already:', filePath);
  return '/api/placeholder/400/250';
};

export const transformOfferingForDisplay = (offering: InvestmentOfferingWithDetails): OfferingDisplayData => {
  // Calculate raised/pledged percentages. Pledged is always >= raised (it's
  // signed commitments, a superset of what's actually been called and
  // paid — see backend/src/routes/offerings.ts's PLEDGED_STATUSES comment).
  const raisedPercentage = offering.target_amount
    ? Math.min(((offering.raised_amount || 0) / offering.target_amount) * 100, 100)
    : 0;
  const pledgedPercentage = offering.target_amount
    ? Math.min(((offering.pledged_amount || 0) / offering.target_amount) * 100, 100)
    : 0;

  // Get primary image from media - check for featured_image type first
  let primaryImage = '/api/placeholder/400/250';
  
  if (offering.offering_media && offering.offering_media.length > 0) {
    // Look for featured_image first
    const featuredImage = offering.offering_media.find(media => 
      media.media_type === 'featured_image'
    );
    
    // `url` is preferred over `file_path`: the backend fills `url` with a
    // pre-signed, directly-usable URL when a filePath exists (see
    // getStorageUrl's comment) — `file_path` alone is just the raw storage
    // path and isn't renderable on its own anymore.
    if (featuredImage && (featuredImage.url || featuredImage.file_path)) {
      primaryImage = getStorageUrl(featuredImage.url || featuredImage.file_path);
    } else {
      // Fallback to first image ordered by display_order
      const firstImage = offering.offering_media
        .filter(media => media.media_type === 'image' || media.media_type === 'featured_image')
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))[0];

      if (firstImage && (firstImage.url || firstImage.file_path)) {
        primaryImage = getStorageUrl(firstImage.url || firstImage.file_path);
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
    pledgedAmount: offering.pledged_amount || 0,
    pledgedPercentage,
    pledgerCount: offering.pledger_count || 0,
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
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getProgressPercentage = (raised: number, target: number) => {
  return Math.min((raised / target) * 100, 100);
};