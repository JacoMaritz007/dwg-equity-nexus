import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Save, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, uploadFile as putFileToSignedUrl } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { FileUploadField } from './FileUploadField';
import { MediaPreview } from './MediaPreview';
import { MilestoneManager, type Milestone } from './MilestoneManager';
import { InvestmentOfferingWithDetails, OfferingMedia } from '@/types/investment';
import { toast } from 'sonner';

// Backend numeric columns accept strings; form fields are optional numbers.
const numOrUndef = (n: number | undefined): string | undefined =>
  n === undefined ? undefined : String(n);

const createOfferingSchema = z.object({
  // Deal Overview
  lister_name: z.string().min(1, 'Lister name is required'),
  product_name: z.string().min(1, 'Product name is required'),
  address: z.string().min(1, 'Address is required'),
  targeted_irr: z.number().min(0, 'Targeted IRR must be positive'),
  targeted_avg_coc: z.number().min(0, 'Targeted Avg. Cash-on-Cash Return must be positive'),
  distribution_overview: z.string().min(1, 'Distribution overview is required'),
  
  // Financial Projections (optional)
  minimum_investment: z.number().optional(),
  tax_fee_adjusted_irr: z.number().optional(),
  tax_fee_adjusted_coc: z.number().optional(),
  tax_adjusted_em: z.number().optional(),
  tax_adjusted_cg: z.number().optional(),
  coc_year_1: z.number().optional(),
  coc_year_2: z.number().optional(),
  coc_year_3: z.number().optional(),
  coc_year_4: z.number().optional(),
  coc_year_5: z.number().optional(),
  coc_year_6: z.number().optional(),
  coc_year_7: z.number().optional(),
  base_fee: z.number().optional(),
  structure_fee: z.number().optional(),
  marketing_sales_fee: z.number().optional(),
  success_fee: z.number().optional(),
  capital_gain_success_fee: z.number().optional(),
  
  // Platform Settings
  disregard_user_levels: z.boolean().default(false),
  published_wealth_migrate: z.boolean().default(false),
  published_private_wealth: z.boolean().default(false),
  other_published: z.boolean().default(false),
  enable_source_wealth_screen: z.boolean().default(false),
  
  // Existing fields
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  investment_type: z.string().min(1, 'Investment type is required'),
  location: z.string().optional(),
  target_amount: z.number().min(1, 'Target amount is required'),
  maximum_investment: z.number().optional(),
  expected_return: z.string().optional(),
  closing_date: z.string().optional(),
});

type CreateOfferingFormData = z.infer<typeof createOfferingSchema>;

interface CreateOfferingFormProps {
  offering?: InvestmentOfferingWithDetails;
  isEditMode?: boolean;
}

export const CreateOfferingForm: React.FC<CreateOfferingFormProps> = ({ 
  offering, 
  isEditMode = false 
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  
  // Existing media state for edit mode
  const [existingMedia, setExistingMedia] = useState<OfferingMedia[]>([]);
  const [mediaToDelete, setMediaToDelete] = useState<string[]>([]);

  // Function to handle media deletion
  const handleRemoveMedia = (mediaId: string) => {
    setMediaToDelete(prev => [...prev, mediaId]);
    setExistingMedia(prev => prev.filter(media => media.id !== mediaId));
  };
  
  // File upload states
  const [listerLogo, setListerLogo] = useState<File[] | null>(null);
  const [sponsorLogo, setSponsorLogo] = useState<File[] | null>(null);
  const [ddProviderLogo, setDdProviderLogo] = useState<File[] | null>(null);
  const [featuredImage, setFeaturedImage] = useState<File[] | null>(null);
  const [galleryImages, setGalleryImages] = useState<File[] | null>(null);
  const [videoLinks, setVideoLinks] = useState('');
  
  // Document states
  const [investmentMemo, setInvestmentMemo] = useState<File[] | null>(null);
  const [legalStructure, setLegalStructure] = useState<File[] | null>(null);
  const [dueDiligence, setDueDiligence] = useState<File[] | null>(null);
  const [financialModel, setFinancialModel] = useState<File[] | null>(null);
  const [otherDocs, setOtherDocs] = useState<File[] | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<CreateOfferingFormData>({
    resolver: zodResolver(createOfferingSchema),
    defaultValues: {
      disregard_user_levels: false,
      published_wealth_migrate: false,
      published_private_wealth: false,
      other_published: false,
      enable_source_wealth_screen: false,
    }
  });

  // Populate form with existing data in edit mode
  useEffect(() => {
    if (isEditMode && offering) {
      const formData: Partial<CreateOfferingFormData> = {
        lister_name: offering.lister_name || '',
        product_name: offering.product_name || '',
        address: offering.address || '',
        targeted_irr: offering.targeted_irr || 0,
        targeted_avg_coc: offering.targeted_avg_coc || 0,
        distribution_overview: offering.distribution_overview || '',
        title: offering.title || '',
        description: offering.description || '',
        investment_type: offering.investment_type || '',
        location: offering.location || '',
        target_amount: offering.target_amount || 0,
        minimum_investment: offering.minimum_investment || 0,
        maximum_investment: offering.maximum_investment || undefined,
        expected_return: offering.expected_return || '',
        closing_date: offering.closing_date ? new Date(offering.closing_date).toISOString().split('T')[0] : '',
        tax_fee_adjusted_irr: offering.tax_fee_adjusted_irr || undefined,
        tax_fee_adjusted_coc: offering.tax_fee_adjusted_coc || undefined,
        tax_adjusted_em: offering.tax_adjusted_em || undefined,
        tax_adjusted_cg: offering.tax_adjusted_cg || undefined,
        coc_year_1: offering.coc_year_1 || undefined,
        coc_year_2: offering.coc_year_2 || undefined,
        coc_year_3: offering.coc_year_3 || undefined,
        coc_year_4: offering.coc_year_4 || undefined,
        coc_year_5: offering.coc_year_5 || undefined,
        coc_year_6: offering.coc_year_6 || undefined,
        coc_year_7: offering.coc_year_7 || undefined,
        base_fee: offering.base_fee || undefined,
        structure_fee: offering.structure_fee || undefined,
        marketing_sales_fee: offering.marketing_sales_fee || undefined,
        success_fee: offering.success_fee || undefined,
        capital_gain_success_fee: offering.capital_gain_success_fee || undefined,
        disregard_user_levels: offering.disregard_user_levels || false,
        published_wealth_migrate: offering.published_wealth_migrate || false,
        published_private_wealth: offering.published_private_wealth || false,
        other_published: offering.other_published || false,
        enable_source_wealth_screen: offering.enable_source_wealth_screen || false,
      };

      reset(formData);

      // Populate milestones
      if (offering.offering_milestones) {
        const existingMilestones: Milestone[] = offering.offering_milestones.map(m => ({
          id: m.id,
          description: m.description,
          date: m.milestone_date ? new Date(m.milestone_date) : undefined
        }));
        setMilestones(existingMilestones);
      }

      // Populate existing media
      if (offering.offering_media) {
        setExistingMedia(offering.offering_media);
        
        // Set video links if any
        const videoLinks = offering.offering_media
          .filter(m => m.media_type === 'video_link')
          .map(m => m.url)
          .filter(Boolean)
          .join('\n');
        if (videoLinks) {
          setVideoLinks(videoLinks);
        }
      }
    }
  }, [isEditMode, offering, reset]);

  // Calculate completion progress
  const watchedFields = watch();
  const calculateProgress = (): number => {
    const requiredFields = [
      'lister_name', 'product_name', 'address', 'targeted_irr', 
      'targeted_avg_coc', 'distribution_overview', 'title', 
      'investment_type', 'target_amount'
    ];
    
    const filledFields = requiredFields.filter(field => {
      const value = watchedFields[field as keyof CreateOfferingFormData];
      return value !== undefined && value !== null && value !== '';
    }).length;
    
    const mediaProgress = (listerLogo ? 25 : 0) + (featuredImage ? 25 : 0) + 
                         (galleryImages && galleryImages.length >= 4 ? 25 : 0) + 
                         (investmentMemo ? 25 : 0);
    
    const fieldProgress = (filledFields / requiredFields.length) * 60;
    const milestoneProgress = milestones.length > 0 ? 20 : 0;
    
    return Math.round(fieldProgress + (mediaProgress * 0.2) + milestoneProgress);
  };

  // Two-step upload: ask the backend for a signed URL scoped to this
  // offering (it decides the storage path — see
  // POST /offerings/:id/media/upload-url and /documents/upload-url in
  // backend/src/routes/offerings.ts and documents.ts), PUT the file
  // directly to Cloud Storage, return the path for the DB row. Throws on
  // failure (network issue, expired signed URL, bucket CORS block) rather
  // than swallowing it — callers are responsible for surfacing the failure,
  // since silently returning null here previously let the form report
  // "updated successfully" while a file had actually never made it to
  // storage or the database.
  const uploadFile = async (
    file: File,
    offeringId: string,
    kind: 'media' | 'document',
  ): Promise<string> => {
    const { url, filePath } = await api.post<{ url: string; filePath: string }>(
      `/offerings/${offeringId}/${kind === 'media' ? 'media' : 'documents'}/upload-url`,
      { fileName: file.name, contentType: file.type },
    );
    await putFileToSignedUrl(url, file);
    return filePath;
  };

  const handleFormSubmit = async (data: CreateOfferingFormData, isDraft = false) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      if (isEditMode && offering) {
        // Update existing offering
        await updateOffering(data, isDraft);
      } else {
        // Create new offering
        await createOffering(data, isDraft);
      }
    } catch (error) {
      console.error('Error saving offering:', error);
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} offering. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const createOffering = async (data: CreateOfferingFormData, isDraft = false) => {
    // Create the offering record with proper field mapping (backend
    // expects camelCase, numeric columns as strings)
      const offeringData = {
        title: data.title,
        investmentType: data.investment_type,
        targetAmount: String(data.target_amount),
        minimumInvestment: String(data.minimum_investment || data.target_amount * 0.01),

        listerName: data.lister_name,
        productName: data.product_name,
        address: data.address,
        targetedIrr: data.targeted_irr !== undefined ? String(data.targeted_irr) : undefined,
        targetedAvgCoc: data.targeted_avg_coc !== undefined ? String(data.targeted_avg_coc) : undefined,
        distributionOverview: data.distribution_overview,

        description: data.description,
        location: data.location,
        maximumInvestment: data.maximum_investment !== undefined ? String(data.maximum_investment) : undefined,
        expectedReturn: data.expected_return,
        closingDate: data.closing_date || undefined,

        taxFeeAdjustedIrr: numOrUndef(data.tax_fee_adjusted_irr),
        taxFeeAdjustedCoc: numOrUndef(data.tax_fee_adjusted_coc),
        taxAdjustedEm: numOrUndef(data.tax_adjusted_em),
        taxAdjustedCg: numOrUndef(data.tax_adjusted_cg),
        cocYear1: numOrUndef(data.coc_year_1),
        cocYear2: numOrUndef(data.coc_year_2),
        cocYear3: numOrUndef(data.coc_year_3),
        cocYear4: numOrUndef(data.coc_year_4),
        cocYear5: numOrUndef(data.coc_year_5),
        cocYear6: numOrUndef(data.coc_year_6),
        cocYear7: numOrUndef(data.coc_year_7),
        baseFee: numOrUndef(data.base_fee),
        structureFee: numOrUndef(data.structure_fee),
        marketingSalesFee: numOrUndef(data.marketing_sales_fee),
        successFee: numOrUndef(data.success_fee),
        capitalGainSuccessFee: numOrUndef(data.capital_gain_success_fee),

        disregardUserLevels: data.disregard_user_levels,
        publishedWealthMigrate: data.published_wealth_migrate,
        publishedPrivateWealth: data.published_private_wealth,
        otherPublished: data.other_published,
        enableSourceWealthScreen: data.enable_source_wealth_screen,

        status: (isDraft ? 'draft' : 'active') as 'draft' | 'active',
      };

      const offering = await api.post<{ id: string }>('/offerings', offeringData);

      // Failures collected rather than swallowed — surfaced to the user
      // below instead of a blanket "success" toast regardless of outcome.
      const failedUploads: string[] = [];

      // Upload media files
      const mediaUploads: Array<{ type: string; file: File; order?: number }> = [];

      if (listerLogo?.[0]) mediaUploads.push({ type: 'lister_logo', file: listerLogo[0] });
      if (sponsorLogo?.[0]) mediaUploads.push({ type: 'sponsor_logo', file: sponsorLogo[0] });
      if (ddProviderLogo?.[0]) mediaUploads.push({ type: 'dd_provider_logo', file: ddProviderLogo[0] });
      if (featuredImage?.[0]) mediaUploads.push({ type: 'featured_image', file: featuredImage[0] });

      if (galleryImages) {
        galleryImages.forEach((file, index) => {
          mediaUploads.push({ type: 'gallery_image', file, order: index });
        });
      }

      for (const upload of mediaUploads) {
        try {
          const filePath = await uploadFile(upload.file, offering.id, 'media');
          await api.post(`/offerings/${offering.id}/media`, {
            mediaType: upload.type,
            filePath,
            fileName: upload.file.name,
            fileSize: upload.file.size,
            mimeType: upload.file.type,
            displayOrder: upload.order || 0,
          });
        } catch (error) {
          console.error(`Failed to upload ${upload.file.name}:`, error);
          failedUploads.push(upload.file.name);
        }
      }

      // Upload documents
      const documentUploads = [
        { category: 'investment_memorandum', files: investmentMemo, required: true },
        { category: 'legal_structure', files: legalStructure, required: true },
        { category: 'due_diligence', files: dueDiligence, required: false },
        { category: 'financial_model', files: financialModel, required: false },
        { category: 'other', files: otherDocs, required: false }
      ];

      for (const docUpload of documentUploads) {
        if (docUpload.files) {
          for (const file of docUpload.files) {
            try {
              const filePath = await uploadFile(file, offering.id, 'document');
              await api.post(`/offerings/${offering.id}/documents`, {
                documentCategory: docUpload.category,
                title: file.name,
                filePath,
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type,
                isRequired: docUpload.required,
              });
            } catch (error) {
              console.error(`Failed to upload ${file.name}:`, error);
              failedUploads.push(file.name);
            }
          }
        }
      }

      // Save milestones
      if (milestones.length > 0) {
        for (const [index, milestone] of milestones.entries()) {
          await api.post(`/offerings/${offering.id}/milestones`, {
            description: milestone.description,
            milestoneDate: milestone.date?.toISOString().split('T')[0],
            milestoneOrder: index + 1,
          });
        }
      }

      // Handle video links
      if (videoLinks.trim()) {
        const videoUrls = videoLinks.split('\n').filter(url => url.trim());
        for (const url of videoUrls) {
          await api.post(`/offerings/${offering.id}/media`, {
            mediaType: 'video_link',
            url: url.trim(),
          });
        }
      }

      if (failedUploads.length > 0) {
        toast.error(
          `${isDraft ? 'Draft saved' : 'Offering created'}, but ${failedUploads.length} file(s) failed to upload: ${failedUploads.join(', ')}. Re-upload them from Edit Offering.`,
        );
      } else {
        toast.success(isDraft ? "Draft saved successfully" : "Offering created successfully");
      }

      navigate('/admin/offerings');
  };

  const updateOffering = async (data: CreateOfferingFormData, isDraft = false) => {
    if (!offering) return;

    const offeringData = {
      title: data.title,
      investmentType: data.investment_type,
      targetAmount: String(data.target_amount),
      minimumInvestment: String(data.minimum_investment || data.target_amount * 0.01),

      listerName: data.lister_name,
      productName: data.product_name,
      address: data.address,
      targetedIrr: data.targeted_irr !== undefined ? String(data.targeted_irr) : undefined,
      targetedAvgCoc: data.targeted_avg_coc !== undefined ? String(data.targeted_avg_coc) : undefined,
      distributionOverview: data.distribution_overview,

      description: data.description,
      location: data.location,
      maximumInvestment: data.maximum_investment !== undefined ? String(data.maximum_investment) : undefined,
      expectedReturn: data.expected_return,
      closingDate: data.closing_date || undefined,

      taxFeeAdjustedIrr: numOrUndef(data.tax_fee_adjusted_irr),
      taxFeeAdjustedCoc: numOrUndef(data.tax_fee_adjusted_coc),
      taxAdjustedEm: numOrUndef(data.tax_adjusted_em),
      taxAdjustedCg: numOrUndef(data.tax_adjusted_cg),
      cocYear1: numOrUndef(data.coc_year_1),
      cocYear2: numOrUndef(data.coc_year_2),
      cocYear3: numOrUndef(data.coc_year_3),
      cocYear4: numOrUndef(data.coc_year_4),
      cocYear5: numOrUndef(data.coc_year_5),
      cocYear6: numOrUndef(data.coc_year_6),
      cocYear7: numOrUndef(data.coc_year_7),
      baseFee: numOrUndef(data.base_fee),
      structureFee: numOrUndef(data.structure_fee),
      marketingSalesFee: numOrUndef(data.marketing_sales_fee),
      successFee: numOrUndef(data.success_fee),
      capitalGainSuccessFee: numOrUndef(data.capital_gain_success_fee),

      disregardUserLevels: data.disregard_user_levels,
      publishedWealthMigrate: data.published_wealth_migrate,
      publishedPrivateWealth: data.published_private_wealth,
      otherPublished: data.other_published,
      enableSourceWealthScreen: data.enable_source_wealth_screen,

      status: (isDraft ? 'draft' : offering.status || 'active') as 'draft' | 'active' | 'closed' | 'cancelled',
    };

    await api.patch(`/offerings/${offering.id}`, offeringData);

    // Delete media marked for deletion
    for (const mediaId of mediaToDelete) {
      await api.delete(`/offerings/${offering.id}/media/${mediaId}`);
    }

    // Failures collected rather than swallowed — surfaced to the user below
    // instead of a blanket "success" toast regardless of outcome.
    const failedUploads: string[] = [];

    // Handle new media uploads (keep existing ones, add new ones —
    // replaceExisting swaps out any prior media of the same type in one
    // atomic call, matching the original delete-then-insert behavior)
    const mediaUploads: Array<{ type: string; file: File; order?: number }> = [];

    if (listerLogo?.[0]) mediaUploads.push({ type: 'lister_logo', file: listerLogo[0] });
    if (sponsorLogo?.[0]) mediaUploads.push({ type: 'sponsor_logo', file: sponsorLogo[0] });
    if (ddProviderLogo?.[0]) mediaUploads.push({ type: 'dd_provider_logo', file: ddProviderLogo[0] });
    if (featuredImage?.[0]) mediaUploads.push({ type: 'featured_image', file: featuredImage[0] });

    if (galleryImages) {
      galleryImages.forEach((file, index) => {
        mediaUploads.push({ type: 'gallery_image', file, order: index });
      });
    }

    for (const upload of mediaUploads) {
      try {
        const filePath = await uploadFile(upload.file, offering.id, 'media');
        await api.post(`/offerings/${offering.id}/media`, {
          mediaType: upload.type,
          filePath,
          fileName: upload.file.name,
          fileSize: upload.file.size,
          mimeType: upload.file.type,
          displayOrder: upload.order || 0,
          replaceExisting: true,
        });
      } catch (error) {
        console.error(`Failed to upload ${upload.file.name}:`, error);
        failedUploads.push(upload.file.name);
      }
    }

    // Handle new document uploads (add to existing ones)
    const documentUploads = [
      { category: 'investment_memorandum', files: investmentMemo, required: true },
      { category: 'legal_structure', files: legalStructure, required: true },
      { category: 'due_diligence', files: dueDiligence, required: false },
      { category: 'financial_model', files: financialModel, required: false },
      { category: 'other', files: otherDocs, required: false }
    ];

    for (const docUpload of documentUploads) {
      if (docUpload.files) {
        for (const file of docUpload.files) {
          try {
            const filePath = await uploadFile(file, offering.id, 'document');
            await api.post(`/offerings/${offering.id}/documents`, {
              documentCategory: docUpload.category,
              title: file.name,
              filePath,
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type,
              isRequired: docUpload.required,
            });
          } catch (error) {
            console.error(`Failed to upload ${file.name}:`, error);
            failedUploads.push(file.name);
          }
        }
      }
    }

    // Update milestones (bulk replace: existing set → current set, in one call)
    await api.put(
      `/offerings/${offering.id}/milestones`,
      milestones.map((milestone, index) => ({
        description: milestone.description,
        milestoneDate: milestone.date?.toISOString().split('T')[0],
        milestoneOrder: index + 1,
      })),
    );

    // Handle video links
    if (videoLinks.trim()) {
      // Remove existing video links (existingMedia already holds this
      // offering's media as fetched for the edit form, filtered here rather
      // than via a bulk-delete-by-type endpoint the backend doesn't have)
      for (const media of existingMedia.filter((m) => m.media_type === 'video_link')) {
        await api.delete(`/offerings/${offering.id}/media/${media.id}`);
      }

      const videoUrls = videoLinks.split('\n').filter(url => url.trim());
      for (const url of videoUrls) {
        await api.post(`/offerings/${offering.id}/media`, {
          mediaType: 'video_link',
          url: url.trim(),
        });
      }
    }

    if (failedUploads.length > 0) {
      toast.error(
        `${isDraft ? 'Draft updated' : 'Offering updated'}, but ${failedUploads.length} file(s) failed to upload: ${failedUploads.join(', ')}. Try re-uploading them.`,
      );
    } else {
      toast.success(isDraft ? "Draft updated successfully" : "Offering updated successfully");
    }

    navigate('/admin/offerings');
  };

  const progress = calculateProgress();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/offerings')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Offerings
          </Button>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">
            {isEditMode ? 'Edit Investment Offering' : 'Create Investment Offering'}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode 
              ? 'Update the investment opportunity details, media, and documentation.'
              : 'Create a comprehensive investment opportunity with detailed information, media, and documentation.'
            }
          </p>
          <div className="flex items-center gap-4">
            <Progress value={progress} className="flex-1" />
            <span className="text-sm font-medium">{progress}% Complete</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => handleFormSubmit(data, false))} className="space-y-8">
        {/* Section 1: Deal Overview */}
        <Card>
          <CardHeader>
            <CardTitle>1. Deal Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lister_name">
                  Lister Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lister_name"
                  {...register('lister_name')}
                  placeholder="Company listing the deal"
                />
                {errors.lister_name && (
                  <p className="text-sm text-destructive mt-1">{errors.lister_name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="product_name">
                  Product Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="product_name"
                  {...register('product_name')}
                  placeholder="Name of the opportunity"
                />
                {errors.product_name && (
                  <p className="text-sm text-destructive mt-1">{errors.product_name.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="address">
                Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address"
                {...register('address')}
                placeholder="Full physical address of the asset"
              />
              {errors.address && (
                <p className="text-sm text-destructive mt-1">{errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="targeted_irr">
                  Targeted IRR (%) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="targeted_irr"
                  type="number"
                  step="0.01"
                  {...register('targeted_irr', { valueAsNumber: true })}
                  placeholder="Expected investor return"
                />
                {errors.targeted_irr && (
                  <p className="text-sm text-destructive mt-1">{errors.targeted_irr.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="targeted_avg_coc">
                  Targeted Avg. Cash-on-Cash Return <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="targeted_avg_coc"
                  type="number"
                  step="0.01"
                  {...register('targeted_avg_coc', { valueAsNumber: true })}
                  placeholder="Average cash return"
                />
                {errors.targeted_avg_coc && (
                  <p className="text-sm text-destructive mt-1">{errors.targeted_avg_coc.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="distribution_overview">
                Distribution Overview <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="distribution_overview"
                {...register('distribution_overview')}
                placeholder="Summary of planned distributions"
                rows={4}
              />
              {errors.distribution_overview && (
                <p className="text-sm text-destructive mt-1">{errors.distribution_overview.message}</p>
              )}
            </div>

            {/* Existing required fields */}
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">
                  Offering Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="Investment offering title"
                />
                {errors.title && (
                  <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="investment_type">
                  Investment Type <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="investment_type"
                  {...register('investment_type')}
                  placeholder="e.g., Real Estate, Private Equity"
                />
                {errors.investment_type && (
                  <p className="text-sm text-destructive mt-1">{errors.investment_type.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Detailed description of the investment opportunity"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="target_amount">
                  Target Amount (R) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="target_amount"
                  type="number"
                  {...register('target_amount', { valueAsNumber: true })}
                  placeholder="Total fundraising target"
                />
                {errors.target_amount && (
                  <p className="text-sm text-destructive mt-1">{errors.target_amount.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  {...register('location')}
                  placeholder="Investment location"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Financial Projections */}
        <Card>
          <CardHeader>
            <CardTitle>2. Financial Projections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minimum_investment">Minimum Investment Amount (R)</Label>
                <Input
                  id="minimum_investment"
                  type="number"
                  {...register('minimum_investment', { valueAsNumber: true })}
                  placeholder="Minimum investment amount"
                />
              </div>

              <div>
                <Label htmlFor="maximum_investment">Maximum Investment Amount (R)</Label>
                <Input
                  id="maximum_investment"
                  type="number"
                  {...register('maximum_investment', { valueAsNumber: true })}
                  placeholder="Maximum investment amount"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tax_fee_adjusted_irr">Tax & Fee Adjusted IRR (for Deal Card)</Label>
                <Input
                  id="tax_fee_adjusted_irr"
                  type="number"
                  step="0.001"
                  {...register('tax_fee_adjusted_irr', { valueAsNumber: true })}
                  placeholder="Tax & fee adjusted IRR"
                />
              </div>

              <div>
                <Label htmlFor="tax_fee_adjusted_coc">Tax & Fee Adjusted COC (for Deal Card)</Label>
                <Input
                  id="tax_fee_adjusted_coc"
                  type="number"
                  step="0.001"
                  {...register('tax_fee_adjusted_coc', { valueAsNumber: true })}
                  placeholder="Tax & fee adjusted COC"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tax_adjusted_em">Tax Adjusted EM</Label>
                <Input
                  id="tax_adjusted_em"
                  type="number"
                  step="0.001"
                  {...register('tax_adjusted_em', { valueAsNumber: true })}
                  placeholder="Tax adjusted EM"
                />
              </div>

              <div>
                <Label htmlFor="tax_adjusted_cg">Tax Adjusted CG</Label>
                <Input
                  id="tax_adjusted_cg"
                  type="number"
                  step="0.001"
                  {...register('tax_adjusted_cg', { valueAsNumber: true })}
                  placeholder="Tax adjusted CG"
                />
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Cash-on-Cash Returns by Year</Label>
              <div className="grid grid-cols-3 md:grid-cols-7 gap-4 mt-2">
                {[1, 2, 3, 4, 5, 6, 7].map(year => (
                  <div key={year}>
                    <Label htmlFor={`coc_year_${year}`} className="text-sm">Year {year}</Label>
                    <Input
                      id={`coc_year_${year}`}
                      type="number"
                      step="0.001"
                      {...register(`coc_year_${year}` as keyof CreateOfferingFormData, { valueAsNumber: true })}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-base font-medium">Platform Fees</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <Label htmlFor="base_fee">Base Fee on Platform</Label>
                  <Input
                    id="base_fee"
                    type="number"
                    step="0.001"
                    {...register('base_fee', { valueAsNumber: true })}
                    placeholder="Base fee amount"
                  />
                </div>

                <div>
                  <Label htmlFor="structure_fee">Structure Fee on Platform</Label>
                  <Input
                    id="structure_fee"
                    type="number"
                    step="0.001"
                    {...register('structure_fee', { valueAsNumber: true })}
                    placeholder="Structure fee amount"
                  />
                </div>

                <div>
                  <Label htmlFor="marketing_sales_fee">Marketing & Sales Absorption Fee (%)</Label>
                  <Input
                    id="marketing_sales_fee"
                    type="number"
                    step="0.001"
                    {...register('marketing_sales_fee', { valueAsNumber: true })}
                    placeholder="Marketing fee percentage"
                  />
                </div>

                <div>
                  <Label htmlFor="success_fee">Success Fee</Label>
                  <Input
                    id="success_fee"
                    type="number"
                    step="0.001"
                    {...register('success_fee', { valueAsNumber: true })}
                    placeholder="Success fee amount"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="capital_gain_success_fee">Capital Gain Success Fee</Label>
                  <Input
                    id="capital_gain_success_fee"
                    type="number"
                    step="0.001"
                    {...register('capital_gain_success_fee', { valueAsNumber: true })}
                    placeholder="Capital gain success fee"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Platform Settings */}
        <Card>
          <CardHeader>
            <CardTitle>3. Platform Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="disregard_user_levels">Disregard User Levels</Label>
                  <p className="text-sm text-muted-foreground">Allow all users regardless of accreditation level</p>
                </div>
                <Switch
                  id="disregard_user_levels"
                  checked={watch('disregard_user_levels')}
                  onCheckedChange={(checked) => setValue('disregard_user_levels', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="published_wealth_migrate">Published to Wealth Migrate</Label>
                  <p className="text-sm text-muted-foreground">Make available on Wealth Migrate platform</p>
                </div>
                <Switch
                  id="published_wealth_migrate"
                  checked={watch('published_wealth_migrate')}
                  onCheckedChange={(checked) => setValue('published_wealth_migrate', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="published_private_wealth">Published to Private Wealth</Label>
                  <p className="text-sm text-muted-foreground">Make available on Private Wealth platform</p>
                </div>
                <Switch
                  id="published_private_wealth"
                  checked={watch('published_private_wealth')}
                  onCheckedChange={(checked) => setValue('published_private_wealth', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="other_published">Other</Label>
                  <p className="text-sm text-muted-foreground">Published to other platforms</p>
                </div>
                <Switch
                  id="other_published"
                  checked={watch('other_published')}
                  onCheckedChange={(checked) => setValue('other_published', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enable_source_wealth_screen">Enable Source of Wealth Screen</Label>
                  <p className="text-sm text-muted-foreground">Require investors to provide wealth source information</p>
                </div>
                <Switch
                  id="enable_source_wealth_screen"
                  checked={watch('enable_source_wealth_screen')}
                  onCheckedChange={(checked) => setValue('enable_source_wealth_screen', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Project Milestones */}
        <Card>
          <CardHeader>
            <CardTitle>4. Project Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <MilestoneManager
              milestones={milestones}
              onChange={setMilestones}
              maxMilestones={5}
            />
          </CardContent>
        </Card>

        {/* Section 5: Deal Media Upload */}
        <Card>
          <CardHeader>
            <CardTitle>5. Deal Media Upload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Existing Media Preview */}
            {isEditMode && existingMedia.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Existing Media</h4>
                <div className="space-y-4">
                  <MediaPreview 
                    media={existingMedia} 
                    onRemove={handleRemoveMedia}
                    mediaType="lister_logo"
                    title="Lister Logo"
                  />
                  <MediaPreview 
                    media={existingMedia} 
                    onRemove={handleRemoveMedia}
                    mediaType="sponsor_logo"
                    title="Sponsor Logo"
                  />
                  <MediaPreview 
                    media={existingMedia} 
                    onRemove={handleRemoveMedia}
                    mediaType="dd_provider_logo"
                    title="DD Provider Logo"
                  />
                  <MediaPreview 
                    media={existingMedia} 
                    onRemove={handleRemoveMedia}
                    mediaType="featured_image"
                    title="Featured Image"
                  />
                  <MediaPreview 
                    media={existingMedia} 
                    onRemove={handleRemoveMedia}
                    mediaType="gallery_image"
                    title="Gallery Images"
                  />
                  <MediaPreview 
                    media={existingMedia} 
                    onRemove={handleRemoveMedia}
                    mediaType="video_link"
                    title="Video Links"
                  />
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FileUploadField
                label="Lister Logo"
                description={isEditMode ? "Upload new logo to replace existing" : "Company logo for the listing entity"}
                accept="image/*"
                required={!isEditMode}
                value={listerLogo}
                onChange={setListerLogo}
                maxSizeMB={5}
              />

              <FileUploadField
                label="Sponsor Logo"
                description={isEditMode ? "Upload new logo to replace existing" : "Optional sponsor company logo"}
                accept="image/*"
                value={sponsorLogo}
                onChange={setSponsorLogo}
                maxSizeMB={5}
              />

              <FileUploadField
                label="DD Provider Logo"
                description={isEditMode ? "Upload new logo to replace existing" : "Due diligence provider logo"}
                accept="image/*"
                value={ddProviderLogo}
                onChange={setDdProviderLogo}
                maxSizeMB={5}
              />

              <FileUploadField
                label="Featured Image"
                description={isEditMode ? "Upload new image to replace existing" : "Main image for the investment opportunity"}
                accept="image/*"
                required={!isEditMode}
                value={featuredImage}
                onChange={setFeaturedImage}
                maxSizeMB={10}
              />
            </div>

            <FileUploadField
              label="Gallery Images"
              description={isEditMode ? "Upload new images to add to gallery" : "Additional images showcasing the investment (minimum 4 required)"}
              accept="image/*"
              multiple
              required={!isEditMode}
              maxFiles={10}
              value={galleryImages}
              onChange={setGalleryImages}
              maxSizeMB={5}
            />

            <div>
              <Label htmlFor="video_links">Video Links</Label>
              <p className="text-sm text-muted-foreground mb-2">
                YouTube URLs (one per line)
              </p>
              <Textarea
                id="video_links"
                value={videoLinks}
                onChange={(e) => setVideoLinks(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 6: Deal Documents Upload */}
        <Card>
          <CardHeader>
            <CardTitle>6. Deal Documents Upload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FileUploadField
              label="Investment Memorandum / Deal Overview"
              description="Comprehensive investment overview document"
              accept=".pdf"
              required
              value={investmentMemo}
              onChange={setInvestmentMemo}
              maxSizeMB={25}
            />

            <FileUploadField
              label="Legal Structure Document"
              description="Legal framework and structure documentation"
              accept=".pdf"
              required
              value={legalStructure}
              onChange={setLegalStructure}
              maxSizeMB={25}
            />

            <FileUploadField
              label="Due Diligence Report"
              description="Independent due diligence analysis"
              accept=".pdf"
              value={dueDiligence}
              onChange={setDueDiligence}
              maxSizeMB={25}
            />

            <FileUploadField
              label="Financial Model"
              description="Excel-based financial projections and analysis"
              accept=".xlsx,.xls"
              value={financialModel}
              onChange={setFinancialModel}
              maxSizeMB={15}
            />

            <FileUploadField
              label="Other Supporting Documents"
              description="Additional relevant documents"
              accept=".pdf,.xlsx,.xls,.doc,.docx"
              multiple
              maxFiles={5}
              value={otherDocs}
              onChange={setOtherDocs}
              maxSizeMB={25}
            />
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSubmit((data) => handleFormSubmit(data, true))}
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              {isEditMode ? 'Save Changes as Draft' : 'Save as Draft'}
            </Button>
          </div>
          
          <Button type="submit" disabled={isLoading}>
            <Send className="h-4 w-4 mr-2" />
            {isLoading 
              ? (isEditMode ? 'Updating...' : 'Creating...') 
              : (isEditMode ? 'Update Offering' : 'Create Offering')
            }
          </Button>
        </div>
      </form>
    </div>
  );
};
