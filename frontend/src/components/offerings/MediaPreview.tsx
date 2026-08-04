import React from 'react';
import { Button } from '@/components/ui/button';
import { X, FileText, Image as ImageIcon, Video } from 'lucide-react';
import { getStorageUrl } from '@/utils/offeringHelpers';
import type { OfferingMedia } from '@/types/investment';

interface MediaPreviewProps {
  media: OfferingMedia[];
  onRemove: (mediaId: string) => void;
  mediaType: string;
  title: string;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({
  media,
  onRemove,
  mediaType,
  title
}) => {
  const filteredMedia = media.filter(m => m.media_type === mediaType);

  if (filteredMedia.length === 0) return null;

  const getMediaIcon = (type: string) => {
    if (type.includes('image')) return <ImageIcon className="h-4 w-4" />;
    if (type.includes('video')) return <Video className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      <div className="grid grid-cols-2 gap-3">
        {filteredMedia.map((item) => (
          <div
            key={item.id}
            className="relative border border-border rounded-lg p-3 bg-card"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                {getMediaIcon(item.media_type)}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {item.file_name || 'Untitled'}
                  </p>
                  {item.file_size && (
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(item.file_size)}
                    </p>
                  )}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(item.id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Image preview for image types */}
            {(item.media_type.includes('image') || item.media_type === 'featured_image') && (
              <div className="mt-2">
                <img
                  src={getStorageUrl(item.file_path || item.url || '')}
                  alt={item.file_name || 'Preview'}
                  className="w-full h-20 object-cover rounded border"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            {/* Video link preview */}
            {item.media_type === 'video_link' && item.url && (
              <div className="mt-2 text-xs text-muted-foreground truncate">
                {item.url}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};